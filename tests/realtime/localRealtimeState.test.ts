import { beforeEach, describe, expect, it } from "vitest";
import { clearRealtimeJoin, getRealtimeJoin, setRealtimeJoin } from "../../src/realtime/localRealtimeState";

describe("localRealtimeState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("참가 정보가 없으면 null을 반환한다", () => {
    expect(getRealtimeJoin()).toBeNull();
  });

  it("참가 정보를 저장하고 그대로 읽어온다", () => {
    setRealtimeJoin({ classCode: "123456", alias: "파랑고래" });
    expect(getRealtimeJoin()).toEqual({ classCode: "123456", alias: "파랑고래" });
  });

  it("clearRealtimeJoin 이후에는 다시 null이 된다", () => {
    setRealtimeJoin({ classCode: "123456", alias: "파랑고래" });
    clearRealtimeJoin();
    expect(getRealtimeJoin()).toBeNull();
  });

  it("실명·학번 필드를 갖지 않는다(별칭만 저장)", () => {
    setRealtimeJoin({ classCode: "999999", alias: "초록별" });
    const raw = localStorage.getItem("physgame2.project-echo.realtimeJoin")!;
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(["alias", "classCode"]);
  });
});
