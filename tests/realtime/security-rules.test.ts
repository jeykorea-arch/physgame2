import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const rules = JSON.parse(readFileSync(join(process.cwd(), "firebase", "database.rules.json"), "utf8"));
const classRules = rules.rules.projectEchoClasses.$classCode;
const studentRules = classRules.students.$uid;
const legacyClassRules = rules.rules.classes.$classCode;

describe("Firebase 실시간 수업 보안 규칙", () => {
  it("기존 physgame 수업 규칙을 같은 데이터베이스에서 보존한다", () => {
    expect(legacyClassRules.public[".validate"]).toContain("child('lesson')");
    expect(legacyClassRules.students.$uid[".write"]).toContain("root.child('classes')");
    expect(legacyClassRules.students.$uid[".validate"]).toContain("completedCount");
  });

  it("교사만 전체 명단을 읽고 학생은 자기 노드만 쓴다", () => {
    expect(classRules.students[".read"]).toContain("ownerUid");
    expect(studentRules[".read"]).toContain("auth.uid === $uid");
    expect(studentRules[".write"]).toContain("auth.uid === $uid");
  });

  it("학생 차시는 교사가 연 활성 차시와 같아야 한다", () => {
    expect(studentRules[".validate"]).toContain("public').child('lessonId').val()");
  });

  it("추가 진행 필드를 허용 범위 안에서만 받는다", () => {
    expect(studentRules.gameStage[".validate"]).toContain("'questions'");
    expect(studentRules.completedMissionCount[".validate"]).toContain("<= 5");
    expect(studentRules.currentMissionId[".validate"]).toContain("length <= 16");
    expect(studentRules.answers.$questionId[".validate"]).toContain("L3-Q04");
    expect(studentRules.answers.$questionId.$other[".validate"]).toBe(false);
  });
});
