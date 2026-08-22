import { useState } from "react";

interface RealtimeJoinScreenProps {
  classCode: string;
  onJoin: (alias: string) => void;
  onSkip: () => void;
}

/** 선생님이 실시간 수업을 연 링크로 들어온 학생에게 수업용 별칭을 받는다. 실명·학번이 아니다. */
export function RealtimeJoinScreen({ classCode, onJoin, onSkip }: RealtimeJoinScreenProps) {
  const [alias, setAlias] = useState("");
  const trimmed = alias.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= 12;

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
          aria-label="수업용 별칭"
          style={{ minHeight: 44, fontSize: "1rem", padding: "8px 12px", borderRadius: 8 }}
        />
        <button disabled={!valid} onClick={() => onJoin(trimmed)}>
          참가하기
        </button>
        <button className="secondary" onClick={onSkip}>
          실시간 수업 없이 계속하기
        </button>
      </div>
    </div>
  );
}
