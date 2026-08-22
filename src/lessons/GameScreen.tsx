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
  /** 새로고침·화면 잠금 복귀 시 20분 컷오프가 리셋되지 않도록 이전 경과 시간을 이어받는다. */
  initialElapsedSeconds?: number;
  /** 실시간 수업에 참가한 경우에만 값이 있다. null이면 실시간 갱신을 전혀 시도하지 않는다. */
  realtimeClassCode?: string | null;
  onGameComplete: (reason: ForcedSaveReason) => void;
}

export function GameScreen({
  lessonMeta,
  lessonContent,
  mode,
  initialElapsedSeconds = 0,
  realtimeClassCode = null,
  onGameComplete,
}: GameScreenProps) {
  const [stage, setStage] = useState<"observe" | "missions" | "questions">("observe");
  const [missionIndex, setMissionIndex] = useState(0);
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [completedQuestionIds, setCompletedQuestionIds] = useState<string[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds);
  const completedRef = useRef(false);

  useEffect(() => {
    const startedAt = Date.now() - initialElapsedSeconds * 1000;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = (reason: ForcedSaveReason, completedQuestionIdsOverride?: string[]) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const progress: ProgressRecord = {
      lessonId: lessonMeta.id,
      mode,
      phase: "explanation",
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
    const handlePageHide = () => {
      if (completedRef.current) return;
      saveProgress({
        lessonId: lessonMeta.id,
        mode,
        phase: "game",
        missionId: lessonContent.missions[missionIndex]?.id ?? null,
        questionId: lessonContent.questions[questionIndex]?.id ?? null,
        completedMissionIds,
        completedQuestionIds,
        elapsedGameSeconds: elapsedSeconds,
        forcedSaveReason: "pagehide",
        updatedAt: new Date().toISOString(),
      });
      if (realtimeClassCode) {
        // pagehide 중 비동기 네트워크 요청은 끝까지 완료된다는 보장이 없다. 최선 노력으로만 보낸다.
        import("../realtime/classSession")
          .then(({ markDisconnected }) => markDisconnected(realtimeClassCode))
          .catch(() => {});
      }
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [lessonMeta.id, mode, missionIndex, questionIndex, completedMissionIds, completedQuestionIds, elapsedSeconds, lessonContent, realtimeClassCode]);

  function handleMissionComplete(missionId: string) {
    setCompletedMissionIds((prev) => [...prev, missionId]);
    if (missionIndex + 1 < lessonContent.missions.length) {
      setMissionIndex((i) => i + 1);
    } else {
      setStage("questions");
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
      setQuestionIndex((i) => i + 1);
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
          <NonArCard arObservationText={lessonContent.storyIntro} onObserved={() => setStage("missions")} />
        ))}

      {stage === "missions" && renderMission(lessonContent.missions[missionIndex], lessonContent, () => handleMissionComplete(lessonContent.missions[missionIndex].id))}

      {stage === "questions" && (
        <QuizQuestion key={lessonContent.questions[questionIndex].id} question={lessonContent.questions[questionIndex]} onComplete={handleAnswerComplete} />
      )}
    </div>
  );
}
