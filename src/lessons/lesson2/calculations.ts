import { lcResonanceFrequency, qualitativeSelectivityResponse, qualitativeYagiGain, radarRadialSpeedFromShift, radarRange } from "../../science/em";
import type { Readout } from "../lesson1/calculations";

export const LESSON2_FIXED = {
  radarWavelengthMeters: 0.03, // 약 10 GHz X-밴드에 해당하는 파장, 고정
  inductanceH: 10e-6, // L 고정, 10 μH
  targetFrequencyHz: 3.5588127e6, // C=200 pF일 때의 목표 수신 주파수
  qualityFactor: 8,
};

export function computeL2M1(roundTripMicroseconds: number): Readout {
  const result = radarRange(roundTripMicroseconds * 1e-6);
  if (!result.inputValid || result.rangeMeters === null) return { primaryLabel: "거리 R", primaryValue: "계산 불가" };
  return { primaryLabel: "편도 거리 R (왕복 시간의 절반)", primaryValue: `${result.rangeMeters.toFixed(1)} m` };
}

export function computeL2M2(radialSpeedMs: number): Readout {
  const dopplerShiftHz = (2 * radialSpeedMs) / LESSON2_FIXED.radarWavelengthMeters;
  const back = radarRadialSpeedFromShift(LESSON2_FIXED.radarWavelengthMeters, dopplerShiftHz);
  const direction = radialSpeedMs > 0 ? "접근(+)" : radialSpeedMs < 0 ? "후퇴(−)" : "빔 방향 운동 없음";
  return {
    primaryLabel: "레이더가 측정한 방사 속도(빔 방향 성분)",
    primaryValue: `${back.radialSpeedMs?.toFixed(1) ?? "0.0"} m/s · ${direction} · Δf ${dopplerShiftHz.toFixed(1)} Hz`,
    note:
      radialSpeedMs === 0
        ? "빔과 수직 성분만 있으면 방사 속도는 0으로 측정될 수 있다. 실제 속력과 같다고 단정하지 않는다."
        : "레이더가 측정하는 것은 빔 방향 성분(방사 속도)이다. 실제 속력과 항상 같지는 않다.",
  };
}

export function computeYagiGain(angleDeg: number): Readout {
  const gain = qualitativeYagiGain((angleDeg * Math.PI) / 180);
  return {
    primaryLabel: "상대 수신 세기(정성 모형)",
    primaryValue: `${(gain * 100).toFixed(0)}%`,
    note: "후방(180도)에서도 응답이 0이 되지 않는다.",
  };
}

export function computeLcResonance(capacitancePf: number): Readout {
  const result = lcResonanceFrequency(LESSON2_FIXED.inductanceH, capacitancePf * 1e-12);
  if (!result.inputValid || result.resonanceFrequencyHz === null) return { primaryLabel: "공명 주파수", primaryValue: "계산 불가" };
  const response = qualitativeSelectivityResponse(
    LESSON2_FIXED.targetFrequencyHz,
    result.resonanceFrequencyHz,
    LESSON2_FIXED.qualityFactor
  );
  return {
    primaryLabel: "공명 주파수 f0",
    primaryValue: `${(result.resonanceFrequencyHz / 1e6).toFixed(3)} MHz`,
    note: `목표 ${(LESSON2_FIXED.targetFrequencyHz / 1e6).toFixed(3)} MHz에서의 상대 수신 응답 ${(response * 100).toFixed(0)}%. 실제 회로는 유한 대역폭을 가진 봉우리 형태다.`,
    completionReady: response >= 0.8,
  };
}

export function lcFrequencyHzForCapacitance(capacitancePf: number): number {
  return lcResonanceFrequency(LESSON2_FIXED.inductanceH, capacitancePf * 1e-12).resonanceFrequencyHz ?? 0;
}
