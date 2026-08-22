import { env, isRealtimeTeacherBoardConfigured } from "../env";

/**
 * Firebase SDK는 실시간 진행판이 실제로 켜져 있을 때만 동적으로 불러온다.
 * 설정이 비어 있으면(기본값) 이 모듈은 아예 로드되지 않아 번들 크기·초기 로딩에 영향이 없다.
 */
let cached: Promise<{
  auth: import("firebase/auth").Auth;
  db: import("firebase/database").Database;
}> | null = null;

export function isRealtimeAvailable(): boolean {
  return isRealtimeTeacherBoardConfigured();
}

export async function getFirebase() {
  if (!isRealtimeAvailable()) {
    throw new Error("실시간 진행판이 설정되지 않았다(.env의 VITE_FIREBASE_*, VITE_ENABLE_REALTIME_TEACHER_BOARD 확인)");
  }
  if (!cached) {
    cached = (async () => {
      const [{ initializeApp }, { getAuth, signInAnonymously, onAuthStateChanged }, { getDatabase }] = await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
        import("firebase/database"),
      ]);
      const app = initializeApp({
        apiKey: env.firebase.apiKey,
        authDomain: env.firebase.authDomain,
        databaseURL: env.firebase.databaseURL,
        projectId: env.firebase.projectId,
        appId: env.firebase.appId,
      });
      const auth = getAuth(app);
      const db = getDatabase(app);
      await new Promise<void>((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            unsubscribe();
            if (user) {
              resolve();
            } else {
              signInAnonymously(auth).then(() => resolve()).catch(reject);
            }
          },
          reject
        );
      });
      return { auth, db };
    })();
  }
  return cached;
}
