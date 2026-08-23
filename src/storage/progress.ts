import { storageKey } from "./keys";
import {
  createAnonymousSessionId,
  type AnswerRecord,
  type LessonMode,
  type ProgressRecord,
  type SessionRecord,
  type TechEventCode,
  type TechEventRecord,
} from "./models";

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getOrCreateSession(contentVersion: string, markerVersion: string): SessionRecord {
  const existing = readJson<SessionRecord>(storageKey.session());
  if (existing && existing.contentVersion === contentVersion) {
    return existing;
  }
  const now = new Date().toISOString();
  if (existing && existing.contentVersion !== contentVersion) {
    // 구 콘텐츠의 문항·진행을 새 버전과 섞지 않는다. 실시간 참가 정보는 수업 연결용이므로 유지한다.
    for (const lessonId of [1, 2, 3]) {
      localStorage.removeItem(storageKey.progress(lessonId));
      localStorage.removeItem(storageKey.answers(lessonId));
      localStorage.removeItem(storageKey.techEvents(lessonId));
      localStorage.removeItem(storageKey.exitCheck(lessonId));
    }
  }
  const session: SessionRecord = {
    sessionId: createAnonymousSessionId(),
    contentVersion,
    markerVersion,
    startedAt: now,
    updatedAt: now,
  };
  writeJson(storageKey.session(), session);
  return session;
}

export function loadProgress(lessonId: 1 | 2 | 3): ProgressRecord | null {
  return readJson<ProgressRecord>(storageKey.progress(lessonId));
}

/** 현재 차시만 처음부터 다시 시작한다. 익명 세션과 실시간 수업 별칭은 유지한다. */
export function clearLessonProgress(lessonId: 1 | 2 | 3): void {
  localStorage.removeItem(storageKey.progress(lessonId));
  localStorage.removeItem(storageKey.answers(lessonId));
  localStorage.removeItem(storageKey.techEvents(lessonId));
  localStorage.removeItem(storageKey.exitCheck(lessonId));
}

export function saveProgress(progress: ProgressRecord): void {
  writeJson(storageKey.progress(progress.lessonId), { ...progress, updatedAt: new Date().toISOString() });
}

export function createInitialProgress(lessonId: 1 | 2 | 3, mode: LessonMode): ProgressRecord {
  return {
    lessonId,
    mode,
    phase: "entry",
    gameStage: "observe",
    missionId: null,
    questionId: null,
    completedMissionIds: [],
    completedQuestionIds: [],
    elapsedGameSeconds: 0,
    forcedSaveReason: null,
    updatedAt: new Date().toISOString(),
  };
}

export function loadAnswers(lessonId: 1 | 2 | 3): AnswerRecord[] {
  return readJson<AnswerRecord[]>(storageKey.answers(lessonId)) ?? [];
}

export function saveAnswer(lessonId: 1 | 2 | 3, answer: AnswerRecord): void {
  const answers = loadAnswers(lessonId).filter((a) => a.questionId !== answer.questionId);
  answers.push(answer);
  writeJson(storageKey.answers(lessonId), answers);
}

export function loadTechEvents(lessonId: 1 | 2 | 3): TechEventRecord[] {
  return readJson<TechEventRecord[]>(storageKey.techEvents(lessonId)) ?? [];
}

export function recordTechEvent(lessonId: 1 | 2 | 3, code: TechEventCode): void {
  const events = loadTechEvents(lessonId);
  events.push({ code, at: new Date().toISOString() });
  writeJson(storageKey.techEvents(lessonId), events);
}

export function saveExitCheckChoice(lessonId: 1 | 2 | 3, correct: boolean): void {
  writeJson(storageKey.exitCheck(lessonId), { correct, at: new Date().toISOString() });
}

export function loadExitCheckChoice(lessonId: 1 | 2 | 3): { correct: boolean; at: string } | null {
  return readJson(storageKey.exitCheck(lessonId));
}
