import { getFirebase } from "./firebaseClient";
import type { ClassPublicInfo, StudentAnswerRecord, StudentRealtimeRecord } from "./types";

/** 6자리 숫자 수업 코드. 학번·이름이 아니라 무작위 코드로만 반을 구분한다. */
function generateClassCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createClass(lessonId: 1 | 2 | 3): Promise<{ classCode: string; uid: string }> {
  const { auth, db } = await getFirebase();
  const { ref, set } = await import("firebase/database");
  const classCode = generateClassCode();
  const info: ClassPublicInfo = { lessonId, active: true, createdAt: Date.now() };
  await set(ref(db, `classes/${classCode}`), { ownerUid: auth.currentUser!.uid, public: info });
  return { classCode, uid: auth.currentUser!.uid };
}

export async function closeClass(classCode: string): Promise<void> {
  const { db } = await getFirebase();
  const { ref, update } = await import("firebase/database");
  await update(ref(db, `classes/${classCode}/public`), { active: false });
}

export async function getClassPublicInfo(classCode: string): Promise<ClassPublicInfo | null> {
  const { db } = await getFirebase();
  const { ref, get } = await import("firebase/database");
  const snap = await get(ref(db, `classes/${classCode}/public`));
  return snap.exists() ? (snap.val() as ClassPublicInfo) : null;
}

/** 학생이 6자리 코드로 수업에 참가한다. alias는 실명·학번이 아닌 2~12자 수업용 별칭이다. */
export async function joinClass(
  classCode: string,
  alias: string,
  lessonId: 1 | 2 | 3,
  mode: "ar" | "non-ar"
): Promise<{ uid: string }> {
  const { auth, db } = await getFirebase();
  const { ref, set } = await import("firebase/database");
  const record: StudentRealtimeRecord = {
    alias,
    connected: true,
    lessonId,
    phase: "entry",
    mode,
    completedQuestionCount: 0,
    score: 0,
    lastSeenAt: Date.now(),
  };
  await set(ref(db, `classes/${classCode}/students/${auth.currentUser!.uid}`), record);
  return { uid: auth.currentUser!.uid };
}

export async function updateStudentProgress(
  classCode: string,
  patch: Partial<Pick<StudentRealtimeRecord, "phase" | "mode" | "completedQuestionCount" | "score">>
): Promise<void> {
  const { auth, db } = await getFirebase();
  const { ref, update } = await import("firebase/database");
  await update(ref(db, `classes/${classCode}/students/${auth.currentUser!.uid}`), { ...patch, lastSeenAt: Date.now() });
}

export async function recordStudentAnswer(classCode: string, questionId: string, answer: StudentAnswerRecord): Promise<void> {
  const { auth, db } = await getFirebase();
  const { ref, update } = await import("firebase/database");
  await update(ref(db, `classes/${classCode}/students/${auth.currentUser!.uid}`), {
    [`answers/${questionId}`]: answer,
    lastSeenAt: Date.now(),
  });
}

export async function markDisconnected(classCode: string): Promise<void> {
  const { auth, db } = await getFirebase();
  const { ref, update } = await import("firebase/database");
  await update(ref(db, `classes/${classCode}/students/${auth.currentUser!.uid}`), { connected: false, lastSeenAt: Date.now() });
}

/** 교사 화면에서 학생 명단을 실시간으로 구독한다. 반환값을 호출하면 구독을 해제한다. */
export async function subscribeToClassRoster(
  classCode: string,
  onChange: (students: Record<string, StudentRealtimeRecord>) => void
): Promise<() => void> {
  const { db } = await getFirebase();
  const { ref, onValue } = await import("firebase/database");
  const studentsRef = ref(db, `classes/${classCode}/students`);
  const unsubscribe = onValue(studentsRef, (snap) => {
    onChange((snap.val() as Record<string, StudentRealtimeRecord>) ?? {});
  });
  return unsubscribe;
}
