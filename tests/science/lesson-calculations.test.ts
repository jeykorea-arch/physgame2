import { describe, expect, it } from "vitest";
import { computeL2M1, computeL2M2, computeLcResonance } from "../../src/lessons/lesson2/calculations";

describe("2차시 화면 계산", () => {
  it("L=10 μH, C=200 pF에서 약 3.56 MHz일 때 X_L과 X_C가 거의 같다", () => {
    const readout = computeL2M1(3.6);
    expect(readout.completionReady).toBe(true);
    expect(readout.primaryValue).toContain("Ω");
    expect(readout.note).toContain("공진 조건");
  });

  it("C가 같을 때 L이 커지면 공진 주파수가 낮아진다", () => {
    const smallL = Number.parseFloat(computeL2M2(4).primaryValue);
    const largeL = Number.parseFloat(computeL2M2(16).primaryValue);
    expect(largeL).toBeCloseTo(smallL / 2, 3);
  });

  it("RLC 수신 응답은 목표 C에서만 높고 모든 값에서 100%가 아니다", () => {
    const offTarget = computeLcResonance(100);
    const onTarget = computeLcResonance(200);
    expect(offTarget.completionReady).toBe(false);
    expect(onTarget.completionReady).toBe(true);
    expect(offTarget.note).not.toContain("응답 100%");
    expect(onTarget.note).toContain("응답 100%");
  });
});
