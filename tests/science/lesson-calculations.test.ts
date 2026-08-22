import { describe, expect, it } from "vitest";
import { computeL2M2, computeLcResonance } from "../../src/lessons/lesson2/calculations";

describe("2차시 화면 계산", () => {
  it("방사 속도의 접근·후퇴 부호를 화면 문자열에 보존한다", () => {
    expect(computeL2M2(20).primaryValue).toContain("접근(+)");
    expect(computeL2M2(-20).primaryValue).toContain("후퇴(−)");
    expect(computeL2M2(-20).primaryValue).toContain("-20.0 m/s");
  });

  it("LC 수신 응답은 목표 C에서만 높고 모든 값에서 100%가 아니다", () => {
    const offTarget = computeLcResonance(100);
    const onTarget = computeLcResonance(200);
    expect(offTarget.completionReady).toBe(false);
    expect(onTarget.completionReady).toBe(true);
    expect(offTarget.note).not.toContain("응답 100%");
    expect(onTarget.note).toContain("응답 100%");
  });
});
