import { useEffect, useState } from "react";
import type { ContentContract, LessonContent } from "../content/types";
import { loadContentContract, loadLessonContent } from "../content/loader";
import type { LessonMode, LessonPhase } from "../storage/models";
import { clearLessonProgress, createInitialProgress, getOrCreateSession, loadAnswers, loadProgress, saveProgress } from "../storage/progress";
import { EntryScreen } from "./EntryScreen";
import { RecallScreen } from "./RecallScreen";
import { GameScreen } from "./GameScreen";
import { ExplanationScreen } from "./ExplanationScreen";
import { ExitCheckScreen } from "./ExitCheckScreen";
import { SaveScreen } from "./SaveScreen";
import { RealtimeJoinScreen } from "../realtime/RealtimeJoinScreen";
import { getRealtimeJoin, setRealtimeJoin } from "../realtime/localRealtimeState";
import { isRealtimeAvailable } from "../realtime/firebaseClient";

interface LessonScreenProps {
  lessonId: 1 | 2 | 3;
  joinClassCode: string | null;
  onGoHome: () => void;
}

function realtimeResumeState(lessonId: 1 | 2 | 3, mode: LessonMode) {
  const progress = loadProgress(lessonId);
  const answers = loadAnswers(lessonId);
  return {
    phase: progress?.phase ?? "entry",
    mode,
    gameStage: progress?.gameStage ?? "observe",
    completedMissionCount: progress?.completedMissionIds.length ?? 0,
    currentMissionId: progress?.missionId ?? "",
    completedQuestionCount: progress?.completedQuestionIds.length ?? 0,
    score: answers.reduce((sum, answer) => sum + answer.score, 0),
  } as const;
}

export function LessonScreen({ lessonId, joinClassCode, onGoHome }: LessonScreenProps) {
  const [contract, setContract] = useState<ContentContract | null>(null);
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<LessonPhase>("entry");
  const [mode, setMode] = useState<LessonMode>("non-ar");

  const savedRealtimeJoin = getRealtimeJoin();
  const alreadyJoined = joinClassCode
    ? savedRealtimeJoin?.classCode === joinClassCode && savedRealtimeJoin.lessonId === lessonId
    : true;
  const [needsAliasPrompt, setNeedsAliasPrompt] = useState(!!joinClassCode && isRealtimeAvailable() && !alreadyJoined);
  const [joinedThisVisit, setJoinedThisVisit] = useState(false);

  const activeClassCode = joinClassCode && (alreadyJoined || joinedThisVisit) ? joinClassCode : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await loadContentContract();
        const l = await loadLessonContent(lessonId);
        if (cancelled) return;
        getOrCreateSession(c.content_version, l.markerVersion);
        setContract(c);
        setLessonContent(l);

        const existing = loadProgress(lessonId);
        if (existing && existing.phase !== "entry") {
          setMode(existing.mode);
          setPhase(existing.phase);
        }

        const savedJoin = getRealtimeJoin();
        if (
          joinClassCode
          && isRealtimeAvailable()
          && savedJoin?.classCode === joinClassCode
          && savedJoin.lessonId === lessonId
        ) {
          const restoredMode = existing?.mode ?? "non-ar";
          import("../realtime/classSession")
            .then(({ joinClass }) =>
              joinClass(joinClassCode, savedJoin.alias, lessonId, restoredMode, realtimeResumeState(lessonId, restoredMode)),
            )
            .catch(() => {
              // 수업이 이미 종료되었어도 학생의 로컬 진행은 그대로 복원한다.
            });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [joinClassCode, lessonId]);

  if (needsAliasPrompt && joinClassCode) {
    return (
      <RealtimeJoinScreen
        classCode={joinClassCode}
        initialAlias={savedRealtimeJoin?.classCode === joinClassCode ? savedRealtimeJoin.alias : ""}
        onJoin={async (alias) => {
          const restoredMode = loadProgress(lessonId)?.mode ?? "non-ar";
          const { joinClass } = await import("../realtime/classSession");
          await joinClass(joinClassCode, alias, lessonId, restoredMode, realtimeResumeState(lessonId, restoredMode));
          setRealtimeJoin({ classCode: joinClassCode, alias, lessonId });
          setJoinedThisVisit(true);
          setNeedsAliasPrompt(false);
        }}
        onSkip={() => setNeedsAliasPrompt(false)}
      />
    );
  }

  if (error) {
    return (
      <div className="screen">
        <div className="panel">
          <p>콘텐츠를 불러오지 못했습니다: {error}</p>
          <button onClick={onGoHome}>홈으로</button>
        </div>
      </div>
    );
  }

  if (!contract || !lessonContent) {
    return (
      <div className="screen">
        <div className="panel">
          <p>불러오는 중...</p>
        </div>
      </div>
    );
  }

  const lessonMeta = contract.lessons.find((l) => l.id === lessonId)!;

  function goPhase(next: LessonPhase, nextMode?: LessonMode) {
    setPhase(next);
    // 기존에 쌓인 진행(완료한 미션·문항, 게임 경과 시간)을 지우지 않고 phase만 갱신한다.
    // GameScreen이 game→explanation 전환 시 이미 상세 진행을 저장하므로, 여기서는 그 값을 덮어쓰지 않는다.
    const existing = loadProgress(lessonId);
    saveProgress({
      ...(existing ?? createInitialProgress(lessonId, nextMode ?? mode)),
      mode: nextMode ?? mode,
      phase: next,
    });

    if (activeClassCode) {
      import("../realtime/classSession")
        .then(({ updateStudentProgress }) => updateStudentProgress(activeClassCode, { phase: next, mode: nextMode ?? mode }))
        .catch(() => {
          // 실시간 갱신 실패는 학생의 로컬 진행에 영향을 주지 않는다.
        });
    }
  }

  function restartCurrentLesson() {
    const confirmed = window.confirm(
      `현재 ${lessonId}차시의 진행과 답안을 모두 지우고 처음 화면으로 돌아갈까요? 수업용 닉네임과 교사용 화면 연결은 유지됩니다.`,
    );
    if (!confirmed) return;

    clearLessonProgress(lessonId);
    setMode("non-ar");
    setPhase("entry");

    if (activeClassCode) {
      import("../realtime/classSession")
        .then(({ resetStudentProgress }) => resetStudentProgress(activeClassCode, "non-ar"))
        .catch(() => {
          // 네트워크가 끊겨도 학생의 로컬 초기화와 학습 재시작은 막지 않는다.
        });
    }
  }

  const restartControl = phase !== "entry" && (
    <div className="student-restart-bar">
      <button className="secondary" onClick={restartCurrentLesson}>↺ 처음부터 다시 시작</button>
    </div>
  );

  switch (phase) {
    case "entry":
      return (
        <EntryScreen
          lessonMeta={lessonMeta}
          storyIntro={lessonContent.storyIntro}
          onChooseMode={async (m) => {
            setMode(m);
            goPhase("recall", m);
          }}
        />
      );
    case "recall":
      return <>{restartControl}<RecallScreen lessonContent={lessonContent} onDone={() => goPhase("game")} /></>;
    case "game":
      return (
        <>
          {restartControl}
          <GameScreen
            lessonMeta={lessonMeta}
            lessonContent={lessonContent}
            mode={mode}
            initialProgress={loadProgress(lessonId)}
            initialAnswers={loadAnswers(lessonId)}
            realtimeClassCode={activeClassCode}
            onGameComplete={() => goPhase("explanation")}
          />
        </>
      );
    case "explanation":
      return <>{restartControl}<ExplanationScreen lessonContent={lessonContent} onDone={() => goPhase("exit")} /></>;
    case "exit":
      return <>{restartControl}<ExitCheckScreen lessonId={lessonId} lessonContent={lessonContent} onDone={() => goPhase("complete")} /></>;
    case "complete":
      return <>{restartControl}<SaveScreen lessonId={lessonId} onGoHome={onGoHome} /></>;
    default:
      return null;
  }
}
