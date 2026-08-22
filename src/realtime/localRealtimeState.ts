import { storageKey } from "../storage/keys";

/** 학생 기기에 저장하는 "지금 어느 실시간 수업에 별칭으로 참가했는가" 상태. 실명·학번을 담지 않는다. */
export interface RealtimeJoinState {
  classCode: string;
  alias: string;
}

export function getRealtimeJoin(): RealtimeJoinState | null {
  try {
    const raw = localStorage.getItem(storageKey.realtimeJoin());
    return raw ? (JSON.parse(raw) as RealtimeJoinState) : null;
  } catch {
    return null;
  }
}

export function setRealtimeJoin(state: RealtimeJoinState): void {
  localStorage.setItem(storageKey.realtimeJoin(), JSON.stringify(state));
}

export function clearRealtimeJoin(): void {
  localStorage.removeItem(storageKey.realtimeJoin());
}
