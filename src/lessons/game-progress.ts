import type { LessonContent } from "../content/types";
import type { AnswerRecord, ProgressRecord } from "../storage/models";

export type GameStage = "observe" | "missions" | "questions";

export interface GameRestoreState {
  stage: GameStage;
  missionIndex: number;
  completedMissionIds: string[];
  questionIndex: number;
  completedQuestionIds: string[];
  totalScore: number;
}

/** 저장된 ID를 현재 콘텐츠와 대조해 안전하게 게임 화면 상태로 복원한다. */
export function deriveGameRestoreState(
  lessonContent: LessonContent,
  progress: ProgressRecord | null,
  answers: AnswerRecord[]
): GameRestoreState {
  const validMissionIds = new Set(lessonContent.missions.map((m) => m.id));
  const validQuestionIds = new Set(lessonContent.questions.map((q) => q.id));
  const completedMissionIds = (progress?.completedMissionIds ?? []).filter((id) => validMissionIds.has(id));
  const completedQuestionIds = (progress?.completedQuestionIds ?? []).filter((id) => validQuestionIds.has(id));

  let stage: GameStage = progress?.gameStage ?? "observe";
  if (!progress?.gameStage) {
    if (completedQuestionIds.length > 0 || completedMissionIds.length >= lessonContent.missions.length) stage = "questions";
    else if (completedMissionIds.length > 0) stage = "missions";
  }

  const savedMissionIndex = progress?.missionId
    ? lessonContent.missions.findIndex((m) => m.id === progress.missionId)
    : -1;
  const firstIncompleteMission = lessonContent.missions.findIndex((m) => !completedMissionIds.includes(m.id));
  const missionIndex = Math.max(0, savedMissionIndex >= 0 ? savedMissionIndex : firstIncompleteMission >= 0 ? firstIncompleteMission : lessonContent.missions.length - 1);

  const savedQuestionIndex = progress?.questionId
    ? lessonContent.questions.findIndex((q) => q.id === progress.questionId)
    : -1;
  const firstIncompleteQuestion = lessonContent.questions.findIndex((q) => !completedQuestionIds.includes(q.id));
  const questionIndex = Math.max(0, savedQuestionIndex >= 0 ? savedQuestionIndex : firstIncompleteQuestion >= 0 ? firstIncompleteQuestion : lessonContent.questions.length - 1);

  const totalScore = answers
    .filter((answer) => completedQuestionIds.includes(answer.questionId))
    .reduce((sum, answer) => sum + answer.score, 0);

  return { stage, missionIndex, completedMissionIds, questionIndex, completedQuestionIds, totalScore };
}
