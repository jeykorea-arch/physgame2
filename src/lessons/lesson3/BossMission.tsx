import { useState } from "react";
import type { ChoiceId, LessonContent, MissionScreenContent } from "../../content/types";

export function BossMission({
  mission,
  bossCheck,
  onComplete,
}: {
  mission: MissionScreenContent;
  bossCheck: LessonContent["bossCheck"];
  onComplete: () => void;
}) {
  const [understood, setUnderstood] = useState(false);
  const [choice, setChoice] = useState<ChoiceId | null>(null);

  return (
    <div className="panel">
      <span className="badge">보스 — 원자 모형 기록 복원</span>
      <h2>{mission.title}</h2>
      <p>{mission.bossNarrative}</p>
      {!understood && <button onClick={() => setUnderstood(true)}>이해했다, 확인 질문으로</button>}

      {understood && bossCheck && (
        <>
          <p>{bossCheck.prompt}</p>
          <div className="choice-list">
            {bossCheck.choices.map((c) => (
              <button
                key={c.id}
                className="choice-button"
                data-state={choice === c.id ? (c.id === bossCheck.correctChoiceId ? "correct" : "incorrect") : undefined}
                onClick={() => setChoice(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          {choice && (
            <div className="feedback-box">
              {choice === bossCheck.correctChoiceId
                ? "맞다. 전자구름은 |ψ|² 위치 확률 밀도의 정성적 표현이다."
                : "전자구름은 실제 안개나 궤도가 아니라 |ψ|² 위치 확률 밀도를 정성적으로 나타낸 것이다."}
            </div>
          )}
          <button disabled={!choice} onClick={onComplete}>
            증거 기록 완료
          </button>
        </>
      )}
    </div>
  );
}
