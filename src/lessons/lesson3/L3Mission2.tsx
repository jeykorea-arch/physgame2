import { useState } from "react";
import type { ChoiceId, MissionScreenContent } from "../../content/types";
import { AccumulationVisualization } from "./AccumulationVisualization";

export function L3Mission2({ mission, onComplete }: { mission: MissionScreenContent; onComplete: () => void }) {
  const steps = mission.discreteValues ?? [1, 20, 200, 2000];
  const [stage, setStage] = useState<"predict" | "interact">("predict");
  const [predictionChoice, setPredictionChoice] = useState<ChoiceId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const count = steps[stepIndex];

  return (
    <div className="panel">
      <span className="badge">미니 미션</span>
      <h2>{mission.title}</h2>
      <p className="qualitative-tag">{mission.arObservationText}</p>

      {stage === "predict" && (
        <>
          <p>{mission.predictionPrompt}</p>
          <div className="choice-list">
            {mission.predictionChoices.map((choice) => (
              <button
                key={choice.id}
                className="choice-button"
                data-state={predictionChoice === choice.id ? (choice.id === mission.correctPredictionChoiceId ? "correct" : "incorrect") : undefined}
                onClick={() => setPredictionChoice(choice.id)}
              >
                {choice.label}
              </button>
            ))}
          </div>
          <button disabled={!predictionChoice} onClick={() => setStage("interact")}>
            다음: 전자를 하나씩 쏘아 누적해보기
          </button>
        </>
      )}

      {stage === "interact" && (
        <>
          <p>
            누적 검출 수: <strong>{count.toLocaleString()}개</strong>
          </p>
          <div className="stepper">
            <button className="secondary" disabled={stepIndex === 0} onClick={() => setStepIndex((i) => Math.max(0, i - 1))}>
              − 이전 단계
            </button>
            <button className="secondary" disabled={stepIndex === steps.length - 1} onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}>
              + 다음 단계
            </button>
          </div>
          <AccumulationVisualization count={count} />
          <p>{mission.verificationCaption}</p>
          <button onClick={onComplete}>증거 기록 완료</button>
        </>
      )}
    </div>
  );
}
