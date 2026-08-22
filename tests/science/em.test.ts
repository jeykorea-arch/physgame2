import { describe, expect, it } from "vitest";
import { lcResonanceFrequency, qualitativeYagiGain, radarRange, radarRadialSpeedFromShift } from "../../src/science/em";

describe("radarRange — 회귀 시험 (docs/04)", () => {
  it("SCI-L2-01: 왕복 시간 2.00 μs → 거리 300 m (유효숫자 3자리, 정밀 c=299,792,458 m/s 사용)", () => {
    const result = radarRange(2.0e-6);
    // 정밀한 c를 사용하므로 299.79...m가 나오며, 유효숫자 3자리에서 300 m와 일치한다.
    expect(result.rangeMeters).toBeCloseTo(300, 0);
  });

  it("SCI-L2-02: 왕복 시간 0 → 거리 0", () => {
    const result = radarRange(0);
    expect(result.rangeMeters).toBe(0);
  });

  it("음의 왕복 시간은 무효 처리한다", () => {
    expect(radarRange(-1).inputValid).toBe(false);
  });
});

describe("lcResonanceFrequency — 회귀 시험 (docs/04)", () => {
  it("SCI-L2-03: L=10μH, C=100pF → 약 5.0329 MHz", () => {
    const result = lcResonanceFrequency(10e-6, 100e-12);
    expect(result.resonanceFrequencyHz! / 1e6).toBeCloseTo(5.0329, 3);
  });

  it("SCI-L2-04: L 고정, C를 4배로 하면 공명 주파수는 1/2배가 된다", () => {
    const base = lcResonanceFrequency(10e-6, 100e-12).resonanceFrequencyHz!;
    const quadrupledC = lcResonanceFrequency(10e-6, 400e-12).resonanceFrequencyHz!;
    expect(quadrupledC).toBeCloseTo(base / 2, 6);
  });

  it("L 또는 C가 0 이하이면 무효 처리한다", () => {
    expect(lcResonanceFrequency(0, 100e-12).inputValid).toBe(false);
    expect(lcResonanceFrequency(10e-6, -1).inputValid).toBe(false);
  });
});

describe("radarRadialSpeedFromShift", () => {
  it("목표 운동이 빔과 수직이면(도플러 편이 0) 방사 속도는 0이 될 수 있다", () => {
    const result = radarRadialSpeedFromShift(0.03, 0);
    expect(result.radialSpeedMs).toBe(0);
  });

  it("파장이 0 이하이면 무효 처리한다", () => {
    expect(radarRadialSpeedFromShift(0, 100).inputValid).toBe(false);
  });
});

describe("qualitativeYagiGain — SCI-ANT-01", () => {
  it("후방 응답이 0이 되지 않는다", () => {
    const backGain = qualitativeYagiGain(Math.PI);
    expect(backGain).toBeGreaterThan(0);
  });

  it("정면 이득이 후방 이득보다 크다", () => {
    const frontGain = qualitativeYagiGain(0);
    const backGain = qualitativeYagiGain(Math.PI);
    expect(frontGain).toBeGreaterThan(backGain);
  });
});
