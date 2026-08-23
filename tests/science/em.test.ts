import { describe, expect, it } from "vitest";
import { qualitativeSelectivityResponse, rlcResonanceFrequency } from "../../src/science/em";

describe("rlcResonanceFrequency — 2차시 RLC 공진", () => {
  it("L=10 μH, C=200 pF이면 공진 주파수는 약 3.5588 MHz이다", () => {
    const result = rlcResonanceFrequency(10e-6, 200e-12);
    expect(result.resonanceFrequencyHz! / 1e6).toBeCloseTo(3.5588, 3);
  });

  it("C가 같을 때 L을 4배로 하면 공진 주파수는 1/2배가 된다", () => {
    const base = rlcResonanceFrequency(10e-6, 200e-12).resonanceFrequencyHz!;
    const quadrupledL = rlcResonanceFrequency(40e-6, 200e-12).resonanceFrequencyHz!;
    expect(quadrupledL).toBeCloseTo(base / 2, 6);
  });

  it("L이 같을 때 C를 4배로 하면 공진 주파수는 1/2배가 된다", () => {
    const base = rlcResonanceFrequency(10e-6, 100e-12).resonanceFrequencyHz!;
    const quadrupledC = rlcResonanceFrequency(10e-6, 400e-12).resonanceFrequencyHz!;
    expect(quadrupledC).toBeCloseTo(base / 2, 6);
  });

  it("L 또는 C가 0 이하이면 계산하지 않는다", () => {
    expect(rlcResonanceFrequency(0, 100e-12).inputValid).toBe(false);
    expect(rlcResonanceFrequency(10e-6, -1).inputValid).toBe(false);
  });
});

describe("RLC 공진 응답 정성 모형", () => {
  it("공진 주파수에서 반응이 가장 크고 주변 주파수에서도 0이 아니다", () => {
    const f0 = rlcResonanceFrequency(10e-6, 200e-12).resonanceFrequencyHz!;
    expect(qualitativeSelectivityResponse(f0, f0)).toBe(1);
    expect(qualitativeSelectivityResponse(f0 * 1.05, f0)).toBeGreaterThan(0);
    expect(qualitativeSelectivityResponse(f0 * 1.05, f0)).toBeLessThan(1);
  });
});
