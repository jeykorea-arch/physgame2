import { useState } from "react";

interface RealtimeJoinScreenProps {
  classCode: string;
  initialAlias?: string;
  onJoin: (alias: string) => Promise<void>;
  onSkip: () => void;
}

/** 선생님이 실시간 수업을 연 링크로 들어온 학생에게 수업용 별칭을 받는다. 실명·학번이 아니다. */
export function RealtimeJoinScreen({ classCode, initialAlias = "", onJoin, onSkip }: RealtimeJoinScreenProps) {
  const [alias, setAlias] = useState(initialAlias);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const trimmed = alias.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= 12;

  async function submitJoin() {
    if (!valid || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      await onJoin(trimmed);
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : "실시간 수업 연결에 실패했습니다.");
      setJoining(false);
    }
  }

  return (
    <div className="screen">
      <div className="panel">
        <span className="badge">실시간 수업 참가 · {classCode}</span>
        <h2>수업용 별칭을 입력하세요</h2>
        <p className="qualitative-tag">
          실명·학번이 아닌 별칭(2~12자)입니다. 선생님 화면에 이 별칭으로만 표시됩니다.
        </p>
        <input
          type="text"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="예: 파랑고래"
          maxLength={12}
          autoComplete="nickname"
          aria-label="수업용 별칭"
          className="student-alias-input"
          onKeyDown={(event) => {
            if (event.key === "Enter") void submitJoin();
          }}
        />
        <button disabled={!valid || joining} onClick={() => void submitJoin()}>
          {joining ? "교사용 화면에 연결 중…" : "닉네임으로 참가하기"}
        </button>
        {joinError && (
          <div className="feedback-box" role="alert">
            <strong>실시간 연결에 실패했습니다.</strong>
            <p>{joinError}</p>
            <button className="secondary" onClick={onSkip}>연결 없이 계속하기</button>
          </div>
        )}
      </div>
    </div>
  );
}
