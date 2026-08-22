import { describe, expect, it } from "vitest";
import { centralFringeWidthApprox, movingSourceDoppler, singleSlitFirstMinimum } from "../../src/science/waves";

describe("movingSourceDoppler — 회귀 시험 (docs/04)", () => {
  it("SCI-L1-01: fs=1000Hz, v=340, vs=34, 접근 → 약 1111.111 Hz", () => {
    const result = movingSourceDoppler(1000, 340, 34, "approaching");
    expect(result.observedFrequencyHz).toBeCloseTo(1111.111111, 3);
  });

  it("SCI-L1-02: 같은 조건, 후퇴 → 약 909.090 Hz", () => {
    const result = movingSourceDoppler(1000, 340, 34, "receding");
    expect(result.observedFrequencyHz).toBeCloseTo(909.090909, 3);
  });

  it("SCI-L1-03: vs=0 → fo = fs", () => {
    const approaching = movingSourceDoppler(1000, 340, 0, "approaching");
    const receding = movingSourceDoppler(1000, 340, 0, "receding");
    expect(approaching.observedFrequencyHz).toBeCloseTo(1000, 6);
    expect(receding.observedFrequencyHz).toBeCloseTo(1000, 6);
  });

  it("음원 속력이 음속 이상이면 초음속으로 표시하고 값을 반환하지 않는다", () => {
    const result = movingSourceDoppler(1000, 340, 340, "approaching");
    expect(result.supersonic).toBe(true);
    expect(result.observedFrequencyHz).toBeNull();
  });

  it("음속이 0 이하이면 입력을 무효로 처리한다", () => {
    const result = movingSourceDoppler(1000, 0, 10, "approaching");
    expect(result.inputValid).toBe(false);
  });
});

describe("singleSlitFirstMinimum / centralFringeWidthApprox", () => {
  it("슬릿 폭 a가 작아질수록 중앙 회절 무늬 폭이 넓어진다", () => {
    const lambda = 500e-9;
    const distance = 1;
    const wideSlit = centralFringeWidthApprox(lambda, 200e-6, distance)!;
    const narrowSlit = centralFringeWidthApprox(lambda, 100e-6, distance)!;
    expect(narrowSlit).toBeGreaterThan(wideSlit);
  });

  it("a < lambda이면 첫 최소가 존재하지 않는다", () => {
    const result = singleSlitFirstMinimum(600e-9, 300e-9);
    expect(result.thetaMinRad).toBeNull();
    expect(result.inputValid).toBe(true);
  });

  it("입력이 0 이하이면 무효 처리한다", () => {
    expect(singleSlitFirstMinimum(0, 100e-6).inputValid).toBe(false);
    expect(singleSlitFirstMinimum(500e-9, -1).inputValid).toBe(false);
  });
});
