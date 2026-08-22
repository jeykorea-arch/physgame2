/**
 * docs/03_기술설계.md 4절 데이터 모델.
 * 실명·학번·이메일·위치·사진·영상·카메라 프레임·마이크는 이 모델에 필드 자체가 없다.
 * 자유 서술·수치 입력 원문은 교사용 외부 결과에서 기본 제외한다(export.ts).
 */

export type LessonMode = "ar" | "non-ar";
export type LessonPhase = "entry" | "recall" | "game" | "explanation" | "exit" | "complete";
export type ForcedSaveReason = "timer" | "user" | "pagehide" | "complete";

export interface SessionRecord {
  sessionId: string;
  contentVersion: string;
  markerVersion: string;
  startedAt: string;
  updatedAt: string;
}

export interface ProgressRecord {
  lessonId: 1 | 2 | 3;
  mode: LessonMode;
  phase: LessonPhase;
  gameStage?: "observe" | "missions" | "questions";
  missionId: string | null;
  questionId: string | null;
  completedMissionIds: string[];
  completedQuestionIds: string[];
  elapsedGameSeconds: number;
  forcedSaveReason: ForcedSaveReason | null;
  updatedAt: string;
}

export interface AnswerRecord {
  questionId: string;
  responseCode: string;
  correct: boolean;
  attempt: number;
  score: 10 | 7 | 5 | 0;
  elapsedSeconds: number;
}

export type TechEventCode =
  | "cameraDenied"
  | "cameraStartFailed"
  | "markerNotFound10s"
  | "markerNotFound20s"
  | "webglFailed"
  | "swUpdateFailed"
  | "fallbackSelected";

export interface TechEventRecord {
  code: TechEventCode;
  at: string;
}

export function scoreForAttempt(attempt: number, resolvedByHint: boolean): AnswerRecord["score"] {
  if (resolvedByHint) return 5;
  if (attempt === 1) return 10;
  if (attempt === 2) return 7;
  return 0;
}

export function createAnonymousSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
