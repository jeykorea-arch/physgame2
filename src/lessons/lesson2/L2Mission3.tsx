import { useState } from "react";
import type { ChoiceId, MissionScreenContent } from "../../content/types";
import { Stepper } from "../../accessibility/Stepper";
import { computeLcResonance, computeYagiGain } from "./calculations";

/** L2-M3는 "두 순차적 단일 조작"이다(content_contract.json). 안테나 방향 → LC 주파수 순서로 한 화면 한 조작을 지킨다. */
export function L2Mission3({ mission, onComplete }: { mission: MissionScreenContent; onComplete: () => void }) {
  const [stage, setStage] = useState<"predict" | "yagi" | "lc">("predict");
  const [predictionChoice, setPredictionChoice] = useState<ChoiceId | null>(null);
  const [angleDeg, setAngleDeg] = useState(90);
  const [capacitancePf, setCapacitancePf] = useState(mission.controlDefault);

  const yagiReadout = computeYagiGain(angleDeg);
  const lcReadout = computeLcResonance(capacitancePf);

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
          <button disabled={!predictionChoice} onClick={() => setStage("yagi")}>
            다음: 안테나 방향 맞추기
          </button>
        </>
      )}

      {stage === "yagi" && (
        <>
          <p>1단계: 야기 안테나 방향을 송신원 쪽으로 맞춘다. 0도가 정면(주엽)이다.</p>
          <Stepper label="안테나 각도(정면 기준)" value={angleDeg} min={0} max={180} step={5} unit="도" onChange={setAngleDeg} />
          <div className="feedback-box">
            <strong>{yagiReadout.primaryLabel}: </strong>
            {yagiReadout.primaryValue}
            {yagiReadout.note && <p className="qualitative-tag">{yagiReadout.note}</p>}
          </div>
          <button onClick={() => setStage("lc")}>다음: 수신 주파수 맞추기</button>
        </>
      )}

      {stage === "lc" && (
        <>
          <p>2단계: L은 고정되어 있다. 정전용량 C만 조절해 목표 주파수에 공명을 맞춘다.</p>
          <Stepper
            label={mission.controlLabel}
            value={capacitancePf}
            min={mission.controlMin}
            max={mission.controlMax}
            step={mission.controlStep}
            unit={mission.controlUnit}
            onChange={setCapacitancePf}
          />
          <div className="feedback-box">
            <strong>{lcReadout.primaryLabel}: </strong>
            {lcReadout.primaryValue}
            {lcReadout.note && <p className="qualitative-tag">{lcReadout.note}</p>}
          </div>
          <p>{mission.verificationCaption}</p>
          <button onClick={onComplete}>증거 기록 완료</button>
        </>
      )}
    </div>
  );
}
