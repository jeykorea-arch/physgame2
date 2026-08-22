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

export function saveProgress(progress: ProgressRecord): void {
  writeJson(storageKey.progress(progress.lessonId), { ...progress, updatedAt: new Date().toISOString() });
}

export function createInitialProgress(lessonId: 1 | 2 | 3, mode: LessonMode): ProgressRecord {
  return {
    lessonId,
    mode,
    phase: "entry",
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
