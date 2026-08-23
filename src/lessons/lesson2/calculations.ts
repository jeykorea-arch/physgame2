import { qualitativeSelectivityResponse, rlcResonanceFrequency } from "../../science/em";
import type { Readout } from "../lesson1/calculations";

export const LESSON2_FIXED = {
  inductanceH: 10e-6, // L 고정, 10 μH
  capacitanceF: 200e-12, // C 고정, 200 pF
  targetFrequencyHz: 3.5588127e6, // C=200 pF일 때의 목표 수신 주파수
  qualityFactor: 8,
};

export function computeL2M1(frequencyMhz: number): Readout {
  const frequencyHz = frequencyMhz * 1e6;
  const inductiveReactance = 2 * Math.PI * frequencyHz * LESSON2_FIXED.inductanceH;
  const capacitiveReactance = 1 / (2 * Math.PI * frequencyHz * LESSON2_FIXED.capacitanceF);
  const difference = Math.abs(inductiveReactance - capacitiveReactance);
  const nearResonance = difference <= 15;
  return {
    primaryLabel: "유도 리액턴스 X_L / 용량 리액턴스 X_C",
    primaryValue: `${inductiveReactance.toFixed(0)} Ω / ${capacitiveReactance.toFixed(0)} Ω`,
    note: nearResonance
      ? "X_L과 X_C가 거의 같아 공진 조건에 도달했다."
      : `두 값의 차이는 약 ${difference.toFixed(0)} Ω이다. 공진에서는 X_L=X_C가 된다.`,
    completionReady: nearResonance,
  };
}

export function computeL2M2(inductanceMicrohenry: number): Readout {
  const result = rlcResonanceFrequency(inductanceMicrohenry * 1e-6, LESSON2_FIXED.capacitanceF);
  if (!result.inputValid || result.resonanceFrequencyHz === null) return { primaryLabel: "공진 주파수", primaryValue: "계산 불가" };
  return {
    primaryLabel: "공진 주파수 f₀",
    primaryValue: `${(result.resonanceFrequencyHz / 1e6).toFixed(3)} MHz`,
    note: "C가 같을 때 L이 커지면 √LC가 커지므로 공진 주파수는 낮아진다.",
  };
}

export function computeLcResonance(capacitancePf: number): Readout {
  const result = rlcResonanceFrequency(LESSON2_FIXED.inductanceH, capacitancePf * 1e-12);
  if (!result.inputValid || result.resonanceFrequencyHz === null) return { primaryLabel: "공진 주파수", primaryValue: "계산 불가" };
  const response = qualitativeSelectivityResponse(
    LESSON2_FIXED.targetFrequencyHz,
    result.resonanceFrequencyHz,
    LESSON2_FIXED.qualityFactor
  );
  return {
    primaryLabel: "공진 주파수 f₀",
    primaryValue: `${(result.resonanceFrequencyHz / 1e6).toFixed(3)} MHz`,
    note: `목표 ${(LESSON2_FIXED.targetFrequencyHz / 1e6).toFixed(3)} MHz에서의 상대 수신 응답 ${(response * 100).toFixed(0)}%. 실제 회로는 유한한 폭의 공진 곡선을 가진다.`,
    completionReady: response >= 0.8,
  };
}

export function lcFrequencyHzForCapacitance(capacitancePf: number): number {
  return rlcResonanceFrequency(LESSON2_FIXED.inductanceH, capacitancePf * 1e-12).resonanceFrequencyHz ?? 0;
}
