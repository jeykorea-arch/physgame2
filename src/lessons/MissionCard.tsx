import { type ReactNode, useState } from "react";
import type { ChoiceId, MissionScreenContent } from "../content/types";
import { Stepper } from "../accessibility/Stepper";
import type { Readout } from "./lesson1/calculations";
import { MissionVisualization } from "./MissionVisualization";

interface MissionCardProps {
  mission: MissionScreenContent;
  computeReadout: (value: number) => Readout;
  extraControls?: ReactNode;
  onComplete: () => void;
}

/** 예측 → 조작 → 검증의 핵심 게임 루프(docs/01 6.2절)를 구현하는 공통 미션 화면. */
export function MissionCard({ mission, computeReadout, extraControls, onComplete }: MissionCardProps) {
  const [stage, setStage] = useState<"predict" | "interact">(mission.predictionChoices.length > 0 ? "predict" : "interact");
  const [predictionChoice, setPredictionChoice] = useState<ChoiceId | null>(null);
  const [controlValue, setControlValue] = useState(mission.controlDefault);

  const readout = computeReadout(controlValue);

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
            다음: 직접 조작해서 검증하기
          </button>
        </>
      )}

      {stage === "interact" && (
        <>
          {extraControls}
          <Stepper
            label={mission.controlLabel}
            value={controlValue}
            min={mission.controlMin}
            max={mission.controlMax}
            step={mission.controlStep}
            unit={mission.controlUnit}
            onChange={setControlValue}
          />
          <MissionVisualization mission={mission} value={controlValue} />
          <div className="feedback-box">
            <strong>{readout.primaryLabel}: </strong>
            {readout.primaryValue}
            {readout.warning && <p className="qualitative-tag">⚠ {readout.warning}</p>}
            {readout.note && <p className="qualitative-tag">{readout.note}</p>}
          </div>
          <p>{mission.verificationCaption}</p>
          {mission.qualitativeModelNotice && <p className="qualitative-tag">{mission.qualitativeModelNotice}</p>}
          <button onClick={onComplete}>증거 기록 완료</button>
        </>
      )}
    </div>
  );
}
