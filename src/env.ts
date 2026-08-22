/**
 * 환경 변수를 읽는 단일 지점. 컴포넌트는 import.meta.env를 직접 읽지 않는다.
 * 비밀 키는 브라우저 코드에 직접 넣지 않는다(docs/03 11절). Firebase 값이 비어 있으면
 * 실시간 진행판 관련 코드 경로 자체가 로드되지 않고 로컬 저장 모드로만 동작한다.
 */
export const env = {
  contentVersion: import.meta.env.VITE_CONTENT_VERSION ?? "unknown",
  enableRealtimeTeacherBoard: import.meta.env.VITE_ENABLE_REALTIME_TEACHER_BOARD === "true",
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
  },
};

export function isRealtimeTeacherBoardConfigured(): boolean {
  return env.enableRealtimeTeacherBoard && Object.values(env.firebase).every((v) => v.length > 0);
}
