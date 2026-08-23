import { getFirebase } from "./firebaseClient";
import type { ClassPublicInfo, StudentAnswerRecord, StudentRealtimeRecord } from "./types";

const activePresence = new Map<string, { heartbeat: number; cancelDisconnect: () => Promise<void> }>();

/** 수업 코드는 학생의 개인정보가 아닌 6자리 무작위 숫자다. */
export function normalizeClassCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

function generateClassCode(): string {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  return String(100000 + (random[0] % 900000));
}

/** 저장한 코드가 같은 익명 교사 계정의 것이면 재사용하고, 아니면 새 코드를 만든다. */
export async function openTeacherClass(
  lessonId: 1 | 2 | 3,
  preferredCode = "",
): Promise<{ classCode: string; uid: string }> {
  const { auth, db } = await getFirebase();
  const { ref, set, update } = await import("firebase/database");
  const uid = auth.currentUser!.uid;
  const normalizedPreferred = normalizeClassCode(preferredCode);

  if (normalizedPreferred.length === 6) {
    try {
      await update(ref(db, `projectEchoClasses/${normalizedPreferred}/public`), { lessonId, active: true });
      return { classCode: normalizedPreferred, uid };
    } catch {
      // 브라우저 인증이 바뀌었거나 다른 수업의 코드이면 새 코드를 만든다.
    }
  }

  const info: ClassPublicInfo = { lessonId, active: true, createdAt: Date.now() };
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const classCode = generateClassCode();
    try {
      await set(ref(db, `projectEchoClasses/${classCode}`), { ownerUid: uid, public: info });
      return { classCode, uid };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("중복되지 않는 수업 코드를 만들지 못했습니다.");
}

/** 기존 호출 호환용. */
export async function createClass(lessonId: 1 | 2 | 3): Promise<{ classCode: string; uid: string }> {
  return openTeacherClass(lessonId);
}

export async function setClassLesson(classCode: string, lessonId: 1 | 2 | 3): Promise<void> {
  const { db } = await getFirebase();
  const { ref, update } = await import("firebase/database");
  await update(ref(db, `projectEchoClasses/${normalizeClassCode(classCode)}/public`), { lessonId, active: true });
}

export async function closeClass(classCode: string): Promise<void> {
  const { db } = await getFirebase();
  const { ref, update } = await import("firebase/database");
  await update(ref(db, `projectEchoClasses/${normalizeClassCode(classCode)}/public`), { active: false });
}

export async function getClassPublicInfo(classCode: string): Promise<ClassPublicInfo | null> {
  const normalized = normalizeClassCode(classCode);
  if (normalized.length !== 6) return null;
  const { db } = await getFirebase();
  const { ref, get } = await import("firebase/database");
  const snap = await get(ref(db, `projectEchoClasses/${normalized}/public`));
  return snap.exists() ? (snap.val() as ClassPublicInfo) : null;
}

/** 학생을 연결하고 onDisconnect·30초 heartbeat로 실제 접속 상태를 유지한다. */
export async function joinClass(
  classCodeInput: string,
  aliasInput: string,
  lessonId: 1 | 2 | 3,
  mode: "ar" | "non-ar",
  initial?: Partial<Pick<StudentRealtimeRecord, "phase" | "gameStage" | "completedMissionCount" | "currentMissionId" | "completedQuestionCount" | "score">>,
): Promise<{ uid: string }> {
  const classCode = normalizeClassCode(classCodeInput);
  const publicInfo = await getClassPublicInfo(classCode);
  if (!publicInfo?.active) throw new Error("종료되었거나 존재하지 않는 수업 코드입니다.");
  if (publicInfo.lessonId !== lessonId) throw new Error(`이 코드는 ${publicInfo.lessonId}차시 수업용입니다.`);

  const alias = aliasInput.trim().replace(/\s+/g, " ").slice(0, 12);
  if (alias.length < 2) throw new Error("2~12자의 수업용 별칭을 입력해 주세요.");

  const { auth, db } = await getFirebase();
  const { onDisconnect, ref, serverTimestamp, update } = await import("firebase/database");
  const uid = auth.currentUser!.uid;
  const studentRef = ref(db, `projectEchoClasses/${classCode}/students/${uid}`);
  const record: StudentRealtimeRecord = {
    alias,
    connected: true,
    lessonId,
    phase: initial?.phase ?? "entry",
    mode,
    gameStage: initial?.gameStage ?? "observe",
    completedMissionCount: initial?.completedMissionCount ?? 0,
    currentMissionId: initial?.currentMissionId ?? "",
    completedQuestionCount: initial?.completedQuestionCount ?? 0,
    score: initial?.score ?? 0,
    lastSeenAt: Date.now(),
  };

  await update(studentRef, record);

  const previous = activePresence.get(classCode);
  if (previous) {
    window.clearInterval(previous.heartbeat);
    await previous.cancelDisconnect().catch(() => undefined);
  }

  const disconnectAction = onDisconnect(studentRef);
  await disconnectAction.update({ connected: false, lastSeenAt: serverTimestamp() });
  const heartbeat = window.setInterval(() => {
    update(studentRef, { connected: true, lastSeenAt: Date.now() }).catch(() => undefined);
  }, 30_000);
  activePresence.set(classCode, { heartbeat, cancelDisconnect: () => disconnectAction.cancel() });

  return { uid };
}

export async function updateStudentProgress(
  classCodeInput: string,
  patch: Partial<Pick<StudentRealtimeRecord, "phase" | "mode" | "gameStage" | "completedMissionCount" | "currentMissionId" | "completedQuestionCount" | "score">>,
): Promise<void> {
  const classCode = normalizeClassCode(classCodeInput);
  const { auth, db } = await getFirebase();
  const { ref, update } = await import("firebase/database");
  await update(ref(db, `projectEchoClasses/${classCode}/students/${auth.currentUser!.uid}`), {
    ...patch,
    connected: true,
    lastSeenAt: Date.now(),
  });
}

/** 학생이 현재 차시를 처음부터 다시 시작할 때 교사용 진행판 기록도 같은 상태로 되돌린다. */
export async function resetStudentProgress(classCodeInput: string, mode: "ar" | "non-ar"): Promise<void> {
  const classCode = normalizeClassCode(classCodeInput);
  const { auth, db } = await getFirebase();
  const { ref, update } = await import("firebase/database");
  await update(ref(db, `projectEchoClasses/${classCode}/students/${auth.currentUser!.uid}`), {
    phase: "entry",
    mode,
    gameStage: "observe",
    completedMissionCount: 0,
    currentMissionId: "",
    completedQuestionCount: 0,
    score: 0,
    answers: null,
    connected: true,
    lastSeenAt: Date.now(),
  });
}

export async function recordStudentAnswer(classCodeInput: string, questionId: string, answer: StudentAnswerRecord): Promise<void> {
  const classCode = normalizeClassCode(classCodeInput);
  const { auth, db } = await getFirebase();
  const { ref, update } = await import("firebase/database");
  await update(ref(db, `projectEchoClasses/${classCode}/students/${auth.currentUser!.uid}`), {
    [`answers/${questionId}`]: answer,
    connected: true,
    lastSeenAt: Date.now(),
  });
}

export async function markDisconnected(classCodeInput: string): Promise<void> {
  const classCode = normalizeClassCode(classCodeInput);
  const presence = activePresence.get(classCode);
  if (presence) {
    window.clearInterval(presence.heartbeat);
    await presence.cancelDisconnect().catch(() => undefined);
    activePresence.delete(classCode);
  }
  const { auth, db } = await getFirebase();
  const { ref, update } = await import("firebase/database");
  await update(ref(db, `projectEchoClasses/${classCode}/students/${auth.currentUser!.uid}`), {
    connected: false,
    lastSeenAt: Date.now(),
  });
}

/** 교사 화면에서 학생 명단을 실시간 구독한다. */
export async function subscribeToClassRoster(
  classCodeInput: string,
  onChange: (students: Record<string, StudentRealtimeRecord>) => void,
  onError?: (message: string) => void,
): Promise<() => void> {
  const classCode = normalizeClassCode(classCodeInput);
  const { db } = await getFirebase();
  const { ref, onValue } = await import("firebase/database");
  const studentsRef = ref(db, `projectEchoClasses/${classCode}/students`);
  return onValue(
    studentsRef,
    (snap) => onChange((snap.val() as Record<string, StudentRealtimeRecord>) ?? {}),
    (error) => onError?.(error.message),
  );
}
