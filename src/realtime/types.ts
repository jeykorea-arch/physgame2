/** Firebase Realtime Database에 쓰는 데이터 모양. firebase/database.rules.json과 필드가 정확히 일치해야 한다. */

export interface ClassPublicInfo {
  lessonId: 1 | 2 | 3;
  active: boolean;
  createdAt: number;
}

export interface StudentAnswerRecord {
  attempt: number;
  correct: boolean;
  score: 0 | 5 | 7 | 10;
  responseCode: string;
}

export interface StudentRealtimeRecord {
  alias: string;
  connected: boolean;
  lessonId: 1 | 2 | 3;
  phase: string;
  mode: "ar" | "non-ar";
  gameStage?: "observe" | "missions" | "questions";
  completedMissionCount?: number;
  currentMissionId?: string;
  completedQuestionCount: number;
  score: number;
  lastSeenAt: number;
  answers?: Record<string, StudentAnswerRecord>;
}
