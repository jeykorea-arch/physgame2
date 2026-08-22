/**
 * 1차시 — 파동의 흔적: 단일 슬릿 회절, 움직이는 음원 도플러 효과.
 * 모든 함수는 순수 함수다. UI는 이 계층의 값만 표시하고 공식을 다시 계산하지 않는다.
 */

export interface SingleSlitResult {
  /** 첫 번째 어두운 무늬(첫 최소)의 회절각, 라디안. 소각근사 밖이면 null. */
  thetaMinRad: number | null;
  /** 소각근사(sinθ≈θ)가 유효한 범위인지 여부. */
  smallAngleValid: boolean;
  /** a > 0, lambda > 0 등 입력이 물리적으로 유효한지. */
  inputValid: boolean;
}

/**
 * 단일 슬릿 회절의 첫 최소 조건: a·sin(θ) = λ
 * 슬릿 폭 a가 파장 λ보다 작으면 첫 최소가 존재하지 않는다(전 구간 밝음에 가까움).
 */
export function singleSlitFirstMinimum(lambda: number, slitWidth: number): SingleSlitResult {
  if (!(lambda > 0) || !(slitWidth > 0)) {
    return { thetaMinRad: null, smallAngleValid: false, inputValid: false };
  }
  const ratio = lambda / slitWidth;
  if (ratio > 1) {
    // sinθ = λ/a > 1이면 첫 최소가 존재하지 않는다.
    return { thetaMinRad: null, smallAngleValid: false, inputValid: true };
  }
  const thetaMinRad = Math.asin(ratio);
  return {
    thetaMinRad,
    smallAngleValid: thetaMinRad < 0.2, // 약 11.5도 이하를 소각근사 유효 범위로 취급
    inputValid: true,
  };
}

/** 슬릿에서 화면까지 거리 D일 때 중앙 회절 무늬(첫 최소 사이) 폭을 근사한다. */
export function centralFringeWidthApprox(lambda: number, slitWidth: number, screenDistance: number): number | null {
  const result = singleSlitFirstMinimum(lambda, slitWidth);
  if (result.thetaMinRad === null || !(screenDistance > 0)) return null;
  return 2 * screenDistance * Math.tan(result.thetaMinRad);
}

export type DopplerDirection = "approaching" | "receding";

export interface MovingSourceDopplerResult {
  observedFrequencyHz: number | null;
  inputValid: boolean;
  /** 음원 속력이 음속 이상이면 초음속 조건이라 이 모델(아음속 가정)이 적용되지 않는다. */
  supersonic: boolean;
}

/**
 * 정지 매질, 정지 관찰자, 움직이는 음원의 도플러 효과.
 * 접근: fo = fs·v/(v - vs)
 * 후퇴: fo = fs·v/(v + vs)
 * 매질에 대한 음속 v는 음원의 운동과 무관하게 일정하다(SCI-WAVE-02).
 */
export function movingSourceDoppler(
  sourceFrequencyHz: number,
  waveSpeed: number,
  sourceSpeed: number,
  direction: DopplerDirection
): MovingSourceDopplerResult {
  if (!(sourceFrequencyHz > 0) || !(waveSpeed > 0) || sourceSpeed < 0) {
    return { observedFrequencyHz: null, inputValid: false, supersonic: false };
  }
  if (sourceSpeed >= waveSpeed) {
    return { observedFrequencyHz: null, inputValid: true, supersonic: true };
  }
  const denominator = direction === "approaching" ? waveSpeed - sourceSpeed : waveSpeed + sourceSpeed;
  return {
    observedFrequencyHz: (sourceFrequencyHz * waveSpeed) / denominator,
    inputValid: true,
    supersonic: false,
  };
}
