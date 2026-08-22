import { useState } from "react";
import type { ChoiceId, MissionScreenContent } from "../../content/types";
import { Stepper } from "../../accessibility/Stepper";
import { qualitativeSelectivityResponse } from "../../science/em";
import { computeLcResonance, computeYagiGain, lcFrequencyHzForCapacitance, LESSON2_FIXED } from "./calculations";

function LcResponsePlot({ capacitancePf }: { capacitancePf: number }) {
  const f0 = lcFrequencyHzForCapacitance(capacitancePf);
  const samples = Array.from({ length: 45 }, (_, i) => {
    const frequencyHz = (1.5 + (i / 44) * 5) * 1e6;
    return {
      x: 12 + (i / 44) * 276,
      y: 106 - qualitativeSelectivityResponse(frequencyHz, f0, LESSON2_FIXED.qualityFactor) * 82,
    };
  });
  const targetX = 12 + (((LESSON2_FIXED.targetFrequencyHz / 1e6) - 1.5) / 5) * 276;
  const path = samples.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 300 130" width="100%" role="img" aria-label="현재 LC 공명 곡선과 목표 수신 주파수">
      <line x1="12" y1="106" x2="288" y2="106" stroke="currentColor" />
      <line x1={targetX} y1="12" x2={targetX} y2="106" stroke="#ffd166" strokeDasharray="5 4" />
      <path d={path} fill="none" stroke="#6fd3ff" strokeWidth="4" />
      <text x="12" y="124" fill="currentColor" fontSize="10">1.5 MHz</text>
      <text x="244" y="124" fill="currentColor" fontSize="10">6.5 MHz</text>
      <text x={Math.min(230, targetX + 4)} y="20" fill="#ffd166" fontSize="10">목표 3.559 MHz</text>
    </svg>
  );
}

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
          <LcResponsePlot capacitancePf={capacitancePf} />
          <p>{mission.verificationCaption}</p>
          {!lcReadout.completionReady && <p className="qualitative-tag">공명 봉우리를 목표 주파수에 맞춰 상대 응답 80% 이상을 만드세요.</p>}
          <button disabled={!lcReadout.completionReady} onClick={onComplete}>증거 기록 완료</button>
        </>
      )}
    </div>
  );
}
