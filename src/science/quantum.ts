/**
 * 3차시 — 양자의 증거: 광전 효과, 드브로이 파장, 최소 불확정성 모형.
 */

export const PLANCK_H_J_S = 6.62607015e-34;
export const HBAR_J_S = 1.054571817e-34;
export const ELECTRON_MASS_KG = 9.1093837015e-31;
export const ELEMENTARY_CHARGE_C = 1.602176634e-19;
export const PLANCK_H_EV_S = PLANCK_H_J_S / ELEMENTARY_CHARGE_C; // h in eV·s

export interface PhotoelectricResult {
  /** 최대 운동 에너지(eV). 문턱 미만이면 방출이 없으므로 null이다(음수로 표시하지 않는다). */
  maxKineticEnergyEv: number | null;
  emitted: boolean;
  inputValid: boolean;
}

/**
 * 광전 효과 최대 운동 에너지: Kmax = hf - φ (hf, φ 모두 eV 단위)
 * SCI-PE-01: 문턱(hf < φ) 아래에서는 세기와 무관하게 방출이 없다. 음의 Kmax를 표시하지 않는다.
 */
export function photoelectricMaxKineticEnergy(photonEnergyEv: number, workFunctionEv: number): PhotoelectricResult {
  if (!(photonEnergyEv >= 0) || !(workFunctionEv >= 0)) {
    return { maxKineticEnergyEv: null, emitted: false, inputValid: false };
  }
  const k = photonEnergyEv - workFunctionEv;
  if (k < 0) {
    return { maxKineticEnergyEv: null, emitted: false, inputValid: true };
  }
  return { maxKineticEnergyEv: k, emitted: true, inputValid: true };
}

/** 광자 에너지(eV) = h(eV·s)·f(Hz) */
export function photonEnergyFromFrequency(frequencyHz: number): number | null {
  if (!(frequencyHz > 0)) return null;
  return PLANCK_H_EV_S * frequencyHz;
}

export interface DeBroglieResult {
  wavelengthMeters: number | null;
  inputValid: boolean;
}

/** 드브로이 파장: λ = h / p (p: 운동량, kg·m/s) */
export function deBroglieWavelength(momentumKgMs: number): DeBroglieResult {
  if (!(momentumKgMs > 0)) return { wavelengthMeters: null, inputValid: false };
  return { wavelengthMeters: PLANCK_H_J_S / momentumKgMs, inputValid: true };
}

/**
 * 가속 전압 V로 가속된 전자의 드브로이 파장(비상대론적 근사).
 * 운동 에너지 eV = p²/(2m) ⇒ p = √(2meV), λ = h/p
 * 이 근사는 V가 커서 상대론적 보정이 필요한 영역(대략 수십 kV 이상)에서는 정확하지 않다.
 */
export function electronWavelengthFromVoltage(voltageV: number): DeBroglieResult {
  if (!(voltageV > 0)) return { wavelengthMeters: null, inputValid: false };
  const momentum = Math.sqrt(2 * ELECTRON_MASS_KG * ELEMENTARY_CHARGE_C * voltageV);
  return deBroglieWavelength(momentum);
}

export interface MinimumMomentumSpreadResult {
  deltaPMinKgMs: number | null;
  inputValid: boolean;
}

/**
 * 최소 불확정성 모형에서 위치 표준편차 Δx로부터 최소 운동량 퍼짐 Δp를 계산한다.
 * Δp_min = ħ / (2Δx). 일반적인 양자 상태는 ΔxΔp ≥ ħ/2이며 등호는 최소 불확정 가우시안 파동 묶음에서만 성립한다.
 * Δx, Δp는 계기 오차가 아니라 반복 측정 분포의 표준편차다(SCI-UNC-01).
 */
export function minimumMomentumSpread(positionSpreadMeters: number): MinimumMomentumSpreadResult {
  if (!(positionSpreadMeters > 0)) return { deltaPMinKgMs: null, inputValid: false };
  return { deltaPMinKgMs: HBAR_J_S / (2 * positionSpreadMeters), inputValid: true };
}

/**
 * 정성적 |ψ|² 확률 밀도 시각화용 1차원 가우시안 분포값(정규화 상수 포함).
 * 실제 원자 오비탈 계산이 아니라 "전자구름은 확률 밀도"라는 개념을 보여주기 위한 정성 모형이다.
 */
export function qualitativeProbabilityDensity(x: number, center: number, spread: number): number {
  if (!(spread > 0)) return 0;
  const z = (x - center) / spread;
  return Math.exp(-0.5 * z * z) / (spread * Math.sqrt(2 * Math.PI));
}
