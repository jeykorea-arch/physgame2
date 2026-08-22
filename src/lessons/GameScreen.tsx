import { useEffect, useRef, useState } from "react";
import type { LessonContent, LessonMeta, MissionScreenContent } from "../content/types";
import type { AnswerRecord, ForcedSaveReason, LessonMode, ProgressRecord } from "../storage/models";
import { recordTechEvent, saveAnswer, saveProgress } from "../storage/progress";
import { ArScanner } from "../ar/ArScanner";
import { NonArCard } from "../ar/NonArCard";
import { targetIndexForLesson, TARGETS_MIND_PATH } from "../ar/marker-registry";
import { MissionCard } from "./MissionCard";
import { QuizQuestion } from "../quiz/QuizQuestion";
import { L1Mission2 } from "./lesson1/L1Mission2";
import { computeL1M1 } from "./lesson1/calculations";
import { L2Mission3 } from "./lesson2/L2Mission3";
import { computeL2M1, computeL2M2 } from "./lesson2/calculations";
import { L3Mission2 } from "./lesson3/L3Mission2";
import { computeL3M1Frequency, computeL3M1Intensity, computeL3M3 } from "./lesson3/calculations";
import { BossMission } from "./lesson3/BossMission";
import { deriveGameRestoreState, type GameStage } from "./game-progress";

const GAME_SECONDS_TOTAL = 20 * 60;
const GAME_SECONDS_SOFT_WARNING = 18 * 60;

function renderMission(mission: MissionScreenContent, lessonContent: LessonContent, onComplete: () => void) {
  // 미션마다 key를 지정해 같은 컴포넌트 타입이 연속될 때(예: L2-M1→L2-M2 모두 MissionCard)
  // React가 인스턴스를 재사용해 이전 미션의 stage·controlValue 상태가 새 미션으로 새어 들어가지 않게 한다.
  switch (mission.id) {
    case "L1-M1":
      return <MissionCard key={mission.id} mission={mission} computeReadout={computeL1M1} onComplete={onComplete} />;
    case "L1-M2":
      return <L1Mission2 key={mission.id} mission={mission} onComplete={onComplete} />;
    case "L2-M1":
      return <MissionCard key={mission.id} mission={mission} computeReadout={computeL2M1} onComplete={onComplete} />;
    case "L2-M2":
      return <MissionCard key={mission.id} mission={mission} computeReadout={computeL2M2} onComplete={onComplete} />;
    case "L2-M3":
      return <L2Mission3 key={mission.id} mission={mission} onComplete={onComplete} />;
    case "L3-M1":
      return <MissionCard key={mission.id} mission={mission} computeReadout={computeL3M1Frequency} onComplete={onComplete} />;
    case "L3-M1b":
      return <MissionCard key={mission.id} mission={mission} computeReadout={computeL3M1Intensity} onComplete={onComplete} />;
    case "L3-M2":
      return <L3Mission2 key={mission.id} mission={mission} onComplete={onComplete} />;
    case "L3-M3":
      return <MissionCard key={mission.id} mission={mission} computeReadout={computeL3M3} onComplete={onComplete} />;
    case "L3-BOSS":
      return <BossMission key={mission.id} mission={mission} bossCheck={lessonContent.bossCheck} onComplete={onComplete} />;
    default:
      return <p>알 수 없는 미션: {mission.id}</p>;
  }
}

interface GameScreenProps {
  lessonMeta: LessonMeta;
  lessonContent: LessonContent;
  mode: LessonMode;
  /** 새로고침·화면 잠금 복귀 시 미션·문항·20분 타이머를 함께 복원한다. */
  initialProgress?: ProgressRecord | null;
  initialAnswers?: AnswerRecord[];
  /** 실시간 수업에 참가한 경우에만 값이 있다. null이면 실시간 갱신을 전혀 시도하지 않는다. */
  realtimeClassCode?: string | null;
  onGameComplete: (reason: ForcedSaveReason) => void;
}

export function GameScreen({
  lessonMeta,
  lessonContent,
  mode,
  initialProgress = null,
  initialAnswers = [],
  realtimeClassCode = null,
  onGameComplete,
}: GameScreenProps) {
  const [restoreState] = useState(() => deriveGameRestoreState(lessonContent, initialProgress, initialAnswers));
  const [stage, setStage] = useState<GameStage>(restoreState.stage);
  const [missionIndex, setMissionIndex] = useState(restoreState.missionIndex);
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>(restoreState.completedMissionIds);
  const [questionIndex, setQuestionIndex] = useState(restoreState.questionIndex);
  const [completedQuestionIds, setCompletedQuestionIds] = useState<string[]>(restoreState.completedQuestionIds);
  const [totalScore, setTotalScore] = useState(restoreState.totalScore);
  const initialElapsedSeconds = initialProgress?.elapsedGameSeconds ?? 0;
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds);
  const completedRef = useRef(false);
  const snapshotRef = useRef<ProgressRecord>(null!);

  snapshotRef.current = {
    lessonId: lessonMeta.id,
    mode,
    phase: "game",
    gameStage: stage,
    missionId: stage === "missions" ? lessonContent.missions[missionIndex]?.id ?? null : null,
    questionId: stage === "questions" ? lessonContent.questions[questionIndex]?.id ?? null : null,
    completedMissionIds,
    completedQuestionIds,
    elapsedGameSeconds: elapsedSeconds,
    forcedSaveReason: null,
    updatedAt: new Date().toISOString(),
  };

  useEffect(() => {
    const startedAt = Date.now() - initialElapsedSeconds * 1000;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!realtimeClassCode) return;
    const currentMissionId = stage === "missions" ? lessonContent.missions[missionIndex]?.id ?? "" : "";
    import("../realtime/classSession")
      .then(({ updateStudentProgress }) =>
        updateStudentProgress(realtimeClassCode, {
          phase: "game",
          mode,
          gameStage: stage,
          completedMissionCount: completedMissionIds.length,
          currentMissionId,
          completedQuestionCount: completedQuestionIds.length,
          score: totalScore,
        }),
      )
      .catch(() => {
        // 실시간 연결 실패는 로컬 게임 진행을 막지 않는다.
      });
  }, [completedMissionIds.length, completedQuestionIds.length, lessonContent.missions, missionIndex, mode, realtimeClassCode, stage, totalScore]);

  const finish = (reason: ForcedSaveReason, completedQuestionIdsOverride?: string[]) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const progress: ProgressRecord = {
      lessonId: lessonMeta.id,
      mode,
      phase: "explanation",
      gameStage: "questions",
      missionId: null,
      questionId: null,
      completedMissionIds,
      completedQuestionIds: completedQuestionIdsOverride ?? completedQuestionIds,
      elapsedGameSeconds: elapsedSeconds,
      forcedSaveReason: reason,
      updatedAt: new Date().toISOString(),
    };
    saveProgress(progress);
    onGameComplete(reason);
  };

  useEffect(() => {
    if (elapsedSeconds >= GAME_SECONDS_TOTAL) {
      finish("timer");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds]);

  useEffect(() => {
    const persistCurrent = (reason: "pagehide" | null = null) => {
      if (completedRef.current) return;
      saveProgress({ ...snapshotRef.current, forcedSaveReason: reason });
    };
    const handlePageHide = () => {
      persistCurrent("pagehide");
      if (realtimeClassCode) {
        // pagehide 중 비동기 네트워크 요청은 끝까지 완료된다는 보장이 없다. 최선 노력으로만 보낸다.
        import("../realtime/classSession")
          .then(({ markDisconnected }) => markDisconnected(realtimeClassCode))
          .catch(() => {});
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") persistCurrent("pagehide");
    };
    const periodicSave = window.setInterval(() => persistCurrent(), 5_000);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(periodicSave);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [realtimeClassCode]);

  function handleMissionComplete(missionId: string) {
    const updatedCompletedMissionIds = completedMissionIds.includes(missionId) ? completedMissionIds : [...completedMissionIds, missionId];
    setCompletedMissionIds(updatedCompletedMissionIds);
    if (missionIndex + 1 < lessonContent.missions.length) {
      const nextMissionIndex = missionIndex + 1;
      setMissionIndex(nextMissionIndex);
      saveProgress({
        ...snapshotRef.current,
        gameStage: "missions",
        missionId: lessonContent.missions[nextMissionIndex].id,
        completedMissionIds: updatedCompletedMissionIds,
      });
    } else {
      setStage("questions");
      saveProgress({
        ...snapshotRef.current,
        gameStage: "questions",
        missionId: null,
        questionId: lessonContent.questions[questionIndex].id,
        completedMissionIds: updatedCompletedMissionIds,
      });
    }
  }

  function handleAnswerComplete(answer: AnswerRecord) {
    saveAnswer(lessonMeta.id, answer);
    const updatedCompletedQuestionIds = [...completedQuestionIds, answer.questionId];
    const updatedTotalScore = totalScore + answer.score;
    setCompletedQuestionIds(updatedCompletedQuestionIds);
    setTotalScore(updatedTotalScore);

    if (realtimeClassCode) {
      import("../realtime/classSession")
        .then(({ recordStudentAnswer, updateStudentProgress }) =>
          Promise.all([
            recordStudentAnswer(realtimeClassCode, answer.questionId, {
              attempt: answer.attempt,
              correct: answer.correct,
              score: answer.score,
              responseCode: answer.responseCode,
            }),
            updateStudentProgress(realtimeClassCode, {
              completedQuestionCount: updatedCompletedQuestionIds.length,
              score: updatedTotalScore,
            }),
          ])
        )
        .catch(() => {
          // 실시간 갱신 실패는 학생의 로컬 진행·채점에 영향을 주지 않는다.
        });
    }

    if (questionIndex + 1 < lessonContent.questions.length) {
      const nextQuestionIndex = questionIndex + 1;
      setQuestionIndex(nextQuestionIndex);
      saveProgress({
        ...snapshotRef.current,
        gameStage: "questions",
        questionId: lessonContent.questions[nextQuestionIndex].id,
        completedQuestionIds: updatedCompletedQuestionIds,
      });
    } else {
      finish("complete", updatedCompletedQuestionIds);
    }
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const progressPct = Math.min(100, (elapsedSeconds / GAME_SECONDS_TOTAL) * 100);

  return (
    <div className="screen">
      <div className="panel">
        <p>
          게임 시간: {minutes}분 {seconds.toString().padStart(2, "0")}초 / 20분
        </p>
        <div className="timer-bar">
          <div style={{ width: `${progressPct}%` }} />
        </div>
        {elapsedSeconds >= GAME_SECONDS_SOFT_WARNING && elapsedSeconds < GAME_SECONDS_TOTAL && (
          <p className="qualitative-tag">18분이 지났습니다. 남은 시간 안에 마무리해주세요. 20분에 자동 저장됩니다.</p>
        )}
      </div>

      {stage === "observe" &&
        (mode === "ar" ? (
          <ArScanner
            targetIndex={targetIndexForLesson(lessonMeta)}
            targetsMindUrl={`${import.meta.env.BASE_URL}${TARGETS_MIND_PATH}`}
            arObservationText={lessonContent.storyIntro}
            onTechEvent={(code) => recordTechEvent(lessonMeta.id, code)}
            onFallback={() => {
              recordTechEvent(lessonMeta.id, "fallbackSelected");
              setStage("missions");
            }}
            onObserved={() => setStage("missions")}
          />
        ) : (
          <NonArCard targetIndex={targetIndexForLesson(lessonMeta)} arObservationText={lessonContent.storyIntro} onObserved={() => setStage("missions")} />
        ))}

      {stage === "missions" && renderMission(lessonContent.missions[missionIndex], lessonContent, () => handleMissionComplete(lessonContent.missions[missionIndex].id))}

      {stage === "questions" && (
        <QuizQuestion key={lessonContent.questions[questionIndex].id} question={lessonContent.questions[questionIndex]} onComplete={handleAnswerComplete} />
      )}
    </div>
  );
}
