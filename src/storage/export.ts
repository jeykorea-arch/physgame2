import { storageKey } from "./keys";
import { loadAnswers, loadExitCheckChoice, loadProgress, loadTechEvents } from "./progress";
import type { SessionRecord } from "./models";

/**
 * 익명 결과 내보내기. 실명·학번·사진·영상·카메라 프레임·위치·자유서술 원문을 포함하지 않는다(SCI privacy invariant).
 * 이 함수가 반환하는 객체의 필드는 content_contract.json의 privacy.allowed_local과 대응한다.
 */
export interface AnonymousExport {
  schemaVersion: "1.0";
  exportedAt: string;
  session: SessionRecord | null;
  lessons: {
    lessonId: number;
    mode: string | null;
    phase: string | null;
    completedQuestionCount: number;
    answers: { questionId: string; correct: boolean; attempt: number; score: number; elapsedSeconds: number }[];
    exitCheckCorrect: boolean | null;
    technicalEvents: { code: string; at: string }[];
  }[];
}

export function buildAnonymousExport(): AnonymousExport {
  const raw = localStorage.getItem(storageKey.session());
  const session = raw ? (JSON.parse(raw) as SessionRecord) : null;

  const lessons = ([1, 2, 3] as const).map((lessonId) => {
    const progress = loadProgress(lessonId);
    const answers = loadAnswers(lessonId);
    const exitCheck = loadExitCheckChoice(lessonId);
    const techEvents = loadTechEvents(lessonId);
    return {
      lessonId,
      mode: progress?.mode ?? null,
      phase: progress?.phase ?? null,
      completedQuestionCount: progress?.completedQuestionIds.length ?? 0,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        correct: a.correct,
        attempt: a.attempt,
        score: a.score,
        elapsedSeconds: a.elapsedSeconds,
      })),
      exitCheckCorrect: exitCheck?.correct ?? null,
      technicalEvents: techEvents.map((e) => ({ code: e.code, at: e.at })),
    };
  });

  return {
    schemaVersion: "1.0",
    exportedAt: new Date().toISOString(),
    session,
    lessons,
  };
}

export function downloadAnonymousExport(): void {
  const data = buildAnonymousExport();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `project-echo-result-${data.session?.sessionId ?? "unknown"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
