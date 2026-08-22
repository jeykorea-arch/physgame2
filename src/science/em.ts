/**
 * 2차시 — 전자기파의 선택: 레이더 거리·방사 속도, LC 공명.
 */

export const SPEED_OF_LIGHT_M_S = 299_792_458;

export interface RadarRangeResult {
  rangeMeters: number | null;
  inputValid: boolean;
}

/** 레이더 거리: R = c·Δt / 2 (왕복 시간 Δt, 초). */
export function radarRange(roundTripSeconds: number): RadarRangeResult {
  if (!(roundTripSeconds >= 0) || !Number.isFinite(roundTripSeconds)) {
    return { rangeMeters: null, inputValid: false };
  }
  return { rangeMeters: (SPEED_OF_LIGHT_M_S * roundTripSeconds) / 2, inputValid: true };
}

export interface RadarRadialSpeedResult {
  radialSpeedMs: number | null;
  inputValid: boolean;
}

/**
 * 단일 기지 송수신 레이더의 방사 속도 크기: |v_r| = |Δf|·λ / 2
 * 이 함수는 크기만 반환한다. 접근/후퇴 부호는 도플러 주파수 편이의 부호로 UI에서 별도로 표시하고,
 * "레이더가 측정하는 것은 빔 방향 성분(방사 속도)"이라는 라벨을 UI에서 항상 함께 보여준다.
 */
export function radarRadialSpeedFromShift(wavelengthMeters: number, dopplerShiftHz: number): RadarRadialSpeedResult {
  if (!(wavelengthMeters > 0) || !Number.isFinite(dopplerShiftHz)) {
    return { radialSpeedMs: null, inputValid: false };
  }
  return { radialSpeedMs: (Math.abs(dopplerShiftHz) * wavelengthMeters) / 2, inputValid: true };
}

export interface LcResonanceResult {
  resonanceFrequencyHz: number | null;
  inputValid: boolean;
}

/** 이상적 LC 공명 주파수: f0 = 1 / (2π√(LC)). 실제 회로는 유한 대역폭을 가진다(SCI-LC-01). */
export function lcResonanceFrequency(inductanceH: number, capacitanceF: number): LcResonanceResult {
  if (!(inductanceH > 0) || !(capacitanceF > 0)) {
    return { resonanceFrequencyHz: null, inputValid: false };
  }
  return {
    resonanceFrequencyHz: 1 / (2 * Math.PI * Math.sqrt(inductanceH * capacitanceF)),
    inputValid: true,
  };
}

/**
 * 유한 대역폭을 가진 실제 선택 곡선의 정성적 응답(공명 곡선) 값을 0~1로 근사한다.
 * 이상적 단일 주파수 통과가 아님을 시각화하기 위한 로렌츠형 근사이며, 회로 해석용 정밀 모형이 아니다.
 */
export function qualitativeSelectivityResponse(frequencyHz: number, resonanceFrequencyHz: number, qualityFactor = 8): number {
  if (!(frequencyHz > 0) || !(resonanceFrequencyHz > 0) || !(qualityFactor > 0)) return 0;
  const x = (frequencyHz - resonanceFrequencyHz) / (resonanceFrequencyHz / qualityFactor);
  return 1 / (1 + x * x);
}

/**
 * 야기 안테나 방향 이득의 정성적 모형(카디오이드 근사).
 * 후방(180도)에서도 0이 되지 않도록 최소 감도 바닥을 둔다(SCI-ANT-01).
 * @param angleFromMainLobeRad 주엽 방향 대비 각도(라디안), 0 = 주엽 정면
 */
export function qualitativeYagiGain(angleFromMainLobeRad: number): number {
  const MIN_BACK_RESPONSE = 0.12; // 후방 응답이 0으로 표시되지 않도록 하는 바닥값
  const forward = (1 + Math.cos(angleFromMainLobeRad)) / 2; // 0~1, 정면=1, 후방=0
  return MIN_BACK_RESPONSE + (1 - MIN_BACK_RESPONSE) * forward;
}
