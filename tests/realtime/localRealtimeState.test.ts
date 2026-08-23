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
    setRealtimeJoin({ classCode: "123456", alias: "파랑고래", lessonId: 1 });
    expect(getRealtimeJoin()).toEqual({ classCode: "123456", alias: "파랑고래", lessonId: 1 });
  });

  it("clearRealtimeJoin 이후에는 다시 null이 된다", () => {
    setRealtimeJoin({ classCode: "123456", alias: "파랑고래", lessonId: 1 });
    clearRealtimeJoin();
    expect(getRealtimeJoin()).toBeNull();
  });

  it("실명·학번 필드를 갖지 않고 수업 연결에 필요한 값만 저장한다", () => {
    setRealtimeJoin({ classCode: "999999", alias: "초록별", lessonId: 3 });
    const raw = localStorage.getItem("physgame2.project-echo.realtimeJoin")!;
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(["alias", "classCode", "lessonId"]);
  });
});
