export interface RealtimeFirebaseConfig {
  enabled: boolean;
  apiKey: string;
  authDomain: string;
  projectId: string;
  databaseURL: string;
  appId: string;
}

const buildTimeConfig: RealtimeFirebaseConfig = {
  enabled: import.meta.env.VITE_ENABLE_REALTIME_TEACHER_BOARD === "true",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
};

let realtimeConfig = buildTimeConfig;

function isComplete(config: RealtimeFirebaseConfig): boolean {
  return config.enabled && [config.apiKey, config.authDomain, config.projectId, config.databaseURL, config.appId].every((value) => value.length > 0);
}

/**
 * 빌드 환경변수가 없을 때 public/firebase-config.json을 읽는다.
 * Firebase 웹 설정값은 공개 식별값이며 실제 권한은 database.rules.json이 강제한다.
 */
export async function loadRuntimeFirebaseConfig(): Promise<void> {
  if (isComplete(buildTimeConfig)) return;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}firebase-config.json`, { cache: "no-store" });
    if (!response.ok) return;
    const candidate = (await response.json()) as Partial<RealtimeFirebaseConfig>;
    const normalized: RealtimeFirebaseConfig = {
      enabled: candidate.enabled === true,
      apiKey: typeof candidate.apiKey === "string" ? candidate.apiKey.trim() : "",
      authDomain: typeof candidate.authDomain === "string" ? candidate.authDomain.trim() : "",
      projectId: typeof candidate.projectId === "string" ? candidate.projectId.trim() : "",
      databaseURL: typeof candidate.databaseURL === "string" ? candidate.databaseURL.trim() : "",
      appId: typeof candidate.appId === "string" ? candidate.appId.trim() : "",
    };
    if (isComplete(normalized)) realtimeConfig = normalized;
  } catch {
    // 설정 파일이 없거나 잘못되어도 로컬 저장 중심의 핵심 수업은 정상 실행한다.
  }
}

export function getRealtimeFirebaseConfig(): RealtimeFirebaseConfig {
  return realtimeConfig;
}

export function isRealtimeTeacherBoardConfigured(): boolean {
  return isComplete(realtimeConfig);
}
