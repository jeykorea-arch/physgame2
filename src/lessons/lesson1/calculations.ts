import { centralFringeWidthApprox, movingSourceDoppler, singleSlitFirstMinimum } from "../../science/waves";

export const LESSON1_FIXED = {
  wavelengthMeters: 500e-9, // 500 nm, 고정
  screenDistanceMeters: 1, // 1 m, 고정
  sourceFrequencyHz: 1000,
  soundSpeedMs: 340,
};

export interface Readout {
  primaryLabel: string;
  primaryValue: string;
  note?: string;
  warning?: string;
  completionReady?: boolean;
}

export function computeL1M1(slitWidthMicrons: number): Readout {
  const a = slitWidthMicrons * 1e-6;
  const result = singleSlitFirstMinimum(LESSON1_FIXED.wavelengthMeters, a);
  if (!result.inputValid) return { primaryLabel: "중앙 무늬 폭", primaryValue: "계산 불가", warning: "슬릿 폭이 유효하지 않다" };
  if (result.thetaMinRad === null) {
    return { primaryLabel: "중앙 무늬 폭", primaryValue: "첫 최소 없음(전 구간 밝음에 가까움)" };
  }
  const width = centralFringeWidthApprox(LESSON1_FIXED.wavelengthMeters, a, LESSON1_FIXED.screenDistanceMeters)!;
  return {
    primaryLabel: "중앙 회절 무늬 폭(첫 최소 사이)",
    primaryValue: `${(width * 1000).toFixed(2)} mm`,
    note: !result.smallAngleValid ? "소각근사 범위를 벗어나 근사값의 오차가 커질 수 있다" : undefined,
  };
}

export function computeL1M2(sourceSpeedMs: number, direction: "approaching" | "receding"): Readout {
  const result = movingSourceDoppler(LESSON1_FIXED.sourceFrequencyHz, LESSON1_FIXED.soundSpeedMs, sourceSpeedMs, direction);
  if (result.supersonic) {
    return { primaryLabel: "관측 진동수", primaryValue: "모델 적용 불가", warning: "음원 속력이 음속 이상이면 이 아음속 모델이 적용되지 않는다" };
  }
  if (!result.inputValid || result.observedFrequencyHz === null) {
    return { primaryLabel: "관측 진동수", primaryValue: "계산 불가" };
  }
  return {
    primaryLabel: `관측 진동수 (${direction === "approaching" ? "접근" : "후퇴"})`,
    primaryValue: `${result.observedFrequencyHz.toFixed(1)} Hz`,
  };
}
