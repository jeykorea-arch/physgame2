/** 2차시 — 전자기파의 선택: 직렬 RLC 회로의 공진 조건과 공진 주파수. */

export interface RlcResonanceResult {
  resonanceFrequencyHz: number | null;
  inputValid: boolean;
}

/** 직렬 RLC 회로의 공진 주파수: f₀=1/(2π√LC). 이상식에서 R은 공진 주파수를 바꾸지 않는다. */
export function rlcResonanceFrequency(inductanceH: number, capacitanceF: number): RlcResonanceResult {
  if (!(inductanceH > 0) || !(capacitanceF > 0)) {
    return { resonanceFrequencyHz: null, inputValid: false };
  }
  return {
    resonanceFrequencyHz: 1 / (2 * Math.PI * Math.sqrt(inductanceH * capacitanceF)),
    inputValid: true,
  };
}

/**
 * 실제 RLC 회로가 공진 주파수 주변에도 어느 정도 반응하는 모습을 0~1로 근사한다.
 * 한 주파수에서만 반응하는 것이 아님을 보여 주는 정성 모형이며, 정밀 회로 해석용은 아니다.
 */
export function qualitativeSelectivityResponse(frequencyHz: number, resonanceFrequencyHz: number, qualityFactor = 8): number {
  if (!(frequencyHz > 0) || !(resonanceFrequencyHz > 0) || !(qualityFactor > 0)) return 0;
  const x = (frequencyHz - resonanceFrequencyHz) / (resonanceFrequencyHz / qualityFactor);
  return 1 / (1 + x * x);
}
