import { useEffect, useState } from "react";
import type { ContentContract, LessonContent } from "../content/types";
import { loadContentContract, loadLessonContent } from "../content/loader";
import type { LessonMode, LessonPhase } from "../storage/models";
import { createInitialProgress, getOrCreateSession, loadAnswers, loadProgress, saveProgress } from "../storage/progress";
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

  const alreadyJoined = joinClassCode ? getRealtimeJoin()?.classCode === joinClassCode : true;
  const [needsAliasPrompt, setNeedsAliasPrompt] = useState(!!joinClassCode && isRealtimeAvailable() && !alreadyJoined);
  const [pendingAlias, setPendingAlias] = useState<string | null>(null);

  const activeClassCode = joinClassCode && (alreadyJoined || pendingAlias) ? joinClassCode : null;

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
        if (joinClassCode && isRealtimeAvailable() && savedJoin?.classCode === joinClassCode) {
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
        onJoin={(alias) => {
          setPendingAlias(alias);
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

  switch (phase) {
    case "entry":
      return (
        <EntryScreen
          lessonMeta={lessonMeta}
          storyIntro={lessonContent.storyIntro}
          onChooseMode={async (m) => {
            setMode(m);
            if (joinClassCode && pendingAlias) {
              try {
                const { joinClass } = await import("../realtime/classSession");
                await joinClass(joinClassCode, pendingAlias, lessonId, m, realtimeResumeState(lessonId, m));
                setRealtimeJoin({ classCode: joinClassCode, alias: pendingAlias });
              } catch (joinError) {
                setError(joinError instanceof Error ? joinError.message : "실시간 수업 참가에 실패했습니다.");
                return;
              }
            }
            goPhase("recall", m);
          }}
        />
      );
    case "recall":
      return <RecallScreen lessonContent={lessonContent} onDone={() => goPhase("game")} />;
    case "game":
      return (
        <GameScreen
          lessonMeta={lessonMeta}
          lessonContent={lessonContent}
          mode={mode}
          initialProgress={loadProgress(lessonId)}
          initialAnswers={loadAnswers(lessonId)}
          realtimeClassCode={activeClassCode}
          onGameComplete={() => goPhase("explanation")}
        />
      );
    case "explanation":
      return <ExplanationScreen lessonContent={lessonContent} onDone={() => goPhase("exit")} />;
    case "exit":
      return <ExitCheckScreen lessonId={lessonId} lessonContent={lessonContent} onDone={() => goPhase("complete")} />;
    case "complete":
      return <SaveScreen lessonId={lessonId} onGoHome={onGoHome} />;
    default:
      return null;
  }
}
