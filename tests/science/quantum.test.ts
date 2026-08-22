import { describe, expect, it } from "vitest";
import {
  electronWavelengthFromVoltage,
  minimumMomentumSpread,
  photoelectricMaxKineticEnergy,
} from "../../src/science/quantum";

describe("photoelectricMaxKineticEnergy — 회귀 시험 (docs/04)", () => {
  it("SCI-L3-01: 광자 3.0eV, 일함수 2.0eV → Kmax=1.0eV", () => {
    const result = photoelectricMaxKineticEnergy(3.0, 2.0);
    expect(result.maxKineticEnergyEv).toBeCloseTo(1.0, 6);
    expect(result.emitted).toBe(true);
  });

  it("SCI-L3-02: 광자 1.5eV, 일함수 2.0eV → 방출 없음, 음의 K 표시 금지", () => {
    const result = photoelectricMaxKineticEnergy(1.5, 2.0);
    expect(result.emitted).toBe(false);
    expect(result.maxKineticEnergyEv).toBeNull();
  });

  it("문턱과 정확히 같으면(hf=φ) Kmax=0인 경계 방출로 처리한다", () => {
    const result = photoelectricMaxKineticEnergy(2.0, 2.0);
    expect(result.emitted).toBe(true);
    expect(result.maxKineticEnergyEv).toBe(0);
  });
});

describe("electronWavelengthFromVoltage — 회귀 시험 (docs/04)", () => {
  it("SCI-L3-03: 가속 전압 150V, 비상대론 → 약 0.100 nm", () => {
    const result = electronWavelengthFromVoltage(150);
    expect(result.wavelengthMeters! * 1e9).toBeCloseTo(0.1, 2);
  });

  it("전압이 0 이하이면 무효 처리한다", () => {
    expect(electronWavelengthFromVoltage(0).inputValid).toBe(false);
  });
});

describe("minimumMomentumSpread — 회귀 시험 (docs/04)", () => {
  it("SCI-L3-04: 최소 불확정 모형에서 Δx가 1/2배가 되면 Δp는 2배가 된다", () => {
    const base = minimumMomentumSpread(1e-10).deltaPMinKgMs!;
    const halved = minimumMomentumSpread(0.5e-10).deltaPMinKgMs!;
    expect(halved).toBeCloseTo(base * 2, 10);
  });

  it("Δx가 0 이하이면 무효 처리한다", () => {
    expect(minimumMomentumSpread(0).inputValid).toBe(false);
  });
});
