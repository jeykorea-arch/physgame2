import { minimumMomentumSpread, photoelectricMaxKineticEnergy, photonEnergyFromFrequency } from "../../science/quantum";
import type { Readout } from "../lesson1/calculations";

export const LESSON3_FIXED = {
  workFunctionEv: 2.0,
  aboveThresholdFrequencyHz: 6.0e14, // 문턱(약 4.83e14 Hz) 위 고정 진동수
};

export function computeL3M1Frequency(frequencyTimes1e14: number): Readout {
  const photonEv = photonEnergyFromFrequency(frequencyTimes1e14 * 1e14);
  if (photonEv === null) return { primaryLabel: "Kmax", primaryValue: "계산 불가" };
  const result = photoelectricMaxKineticEnergy(photonEv, LESSON3_FIXED.workFunctionEv);
  if (!result.emitted || result.maxKineticEnergyEv === null) {
    return { primaryLabel: "광전자 방출", primaryValue: "없음", note: "문턱 진동수 아래에서는 세기를 높여도 방출되지 않는다." };
  }
  return { primaryLabel: "최대 운동 에너지 Kmax", primaryValue: `${result.maxKineticEnergyEv.toFixed(2)} eV` };
}

export function computeL3M1Intensity(relativeIntensity: number): Readout {
  const photonEv = photonEnergyFromFrequency(LESSON3_FIXED.aboveThresholdFrequencyHz)!;
  const result = photoelectricMaxKineticEnergy(photonEv, LESSON3_FIXED.workFunctionEv);
  return {
    primaryLabel: "상대 광전류(방출 전자 수)",
    primaryValue: `${relativeIntensity}× 단위`,
    note: `Kmax는 세기와 무관하게 ${result.maxKineticEnergyEv?.toFixed(2) ?? "0"} eV로 고정된다(진동수만 결정).`,
  };
}

export function computeL3M3(deltaXAngstrom: number): Readout {
  const deltaXMeters = deltaXAngstrom * 1e-10;
  const result = minimumMomentumSpread(deltaXMeters);
  if (!result.inputValid || result.deltaPMinKgMs === null) {
    return { primaryLabel: "최소 운동량 분포 폭 Δp", primaryValue: "계산 불가" };
  }
  return {
    primaryLabel: "최소 운동량 분포 폭 Δp = ħ/(2Δx)",
    primaryValue: `${result.deltaPMinKgMs.toExponential(3)} kg·m/s`,
    note: "Δx, Δp는 반복 측정 분포의 표준편차다. 계기 오차가 아니라 양자 상태의 본질적 퍼짐이다. 일반 상태는 ΔxΔp가 이보다 클 수 있다(등호는 최소 불확정 상태).",
  };
}

export const ACCUMULATION_STEPS = [1, 20, 200, 2000];
