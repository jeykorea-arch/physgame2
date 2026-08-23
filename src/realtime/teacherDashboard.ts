import type { StudentRealtimeRecord } from "./types";

export const LESSON_LIVE_META = {
  1: { title: "파동의 흔적", missionTotal: 2 },
  2: { title: "전자기파의 선택", missionTotal: 3 },
  3: { title: "양자의 증거", missionTotal: 5 },
} as const;

export const PHASE_LABEL: Record<string, string> = {
  entry: "진입",
  recall: "선수학습 회상",
  game: "핵심 게임",
  explanation: "정확한 설명",
  exit: "출구 확인",
  complete: "완료",
};

export function buildStudentJoinUrl(currentHref: string, classCode: string, lessonId: 1 | 2 | 3): string {
  const url = new URL(currentHref);
  url.search = "";
  url.searchParams.set("class", classCode);
  url.searchParams.set("lesson", String(lessonId));
  url.hash = "";
  return url.toString();
}

export function buildLessonEntryUrl(currentHref: string, lessonId: 1 | 2 | 3): string {
  const url = new URL(currentHref);
  url.search = "";
  url.searchParams.set("lesson", String(lessonId));
  url.hash = "";
  return url.toString();
}

export function isStudentOnline(student: StudentRealtimeRecord, now = Date.now()): boolean {
  return student.connected && Number.isFinite(student.lastSeenAt) && now - student.lastSeenAt <= 90_000;
}

export function summarizeRoster(
  roster: Record<string, StudentRealtimeRecord>,
  lessonId: 1 | 2 | 3,
  now = Date.now(),
) {
  const students = Object.values(roster).filter((student) => student.lessonId === lessonId);
  const online = students.filter((student) => isStudentOnline(student, now));
  const completed = students.filter((student) => student.phase === "complete" || student.completedQuestionCount >= 4);
  return {
    total: students.length,
    connected: online.length,
    active: online.filter((student) => student.phase !== "complete" && student.completedQuestionCount < 4).length,
    completed: completed.length,
    nonAr: online.filter((student) => student.phase !== "entry" && student.mode === "non-ar").length,
  };
}

export function progressPercent(student: StudentRealtimeRecord): number {
  if (student.phase === "complete") return 100;
  if (student.phase === "exit") return 95;
  if (student.phase === "explanation") return 90;
  if (student.phase === "recall") return 15;
  if (student.phase === "entry") return 5;

  const missionTotal = LESSON_LIVE_META[student.lessonId].missionTotal;
  const missionPart = (Math.min(missionTotal, student.completedMissionCount ?? 0) / missionTotal) * 30;
  const questionPart = (Math.min(4, student.completedQuestionCount) / 4) * 40;
  return Math.round(20 + missionPart + questionPart);
}

export function progressLabel(student: StudentRealtimeRecord): string {
  if (student.phase === "entry") return "접속 · 시작 방식 선택 전";
  const phase = PHASE_LABEL[student.phase] ?? student.phase;
  if (student.phase !== "game") return phase;
  const missionTotal = LESSON_LIVE_META[student.lessonId].missionTotal;
  if (student.gameStage === "questions") return `${phase} · 문항 ${student.completedQuestionCount}/4`;
  return `${phase} · 미션 ${student.completedMissionCount ?? 0}/${missionTotal}`;
}
