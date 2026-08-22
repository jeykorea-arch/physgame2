import { describe, expect, it } from "vitest";
import { parseRoute } from "../../src/app/routing";

describe("physgame 호환 URL 라우팅", () => {
  it("?teacher=1을 교사용 진행판으로 연다", () => {
    expect(parseRoute("https://school.example/physgame2/?teacher=1")).toEqual({ name: "teacher" });
  });

  it("학생 QR의 lesson 쿼리로 해당 차시를 바로 연다", () => {
    expect(parseRoute("https://school.example/physgame2/?class=123456&lesson=3")).toEqual({ name: "lesson", lessonId: 3 });
  });

  it("기존 hash 차시 주소도 계속 지원한다", () => {
    expect(parseRoute("https://school.example/physgame2/#/lesson/2")).toEqual({ name: "lesson", lessonId: 2 });
  });

  it("허용하지 않은 차시는 홈으로 보낸다", () => {
    expect(parseRoute("https://school.example/physgame2/?lesson=4")).toEqual({ name: "home" });
  });
});
