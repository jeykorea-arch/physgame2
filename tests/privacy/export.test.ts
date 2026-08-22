import { beforeEach, describe, expect, it } from "vitest";
import { buildAnonymousExport } from "../../src/storage/export";
import { getOrCreateSession, saveAnswer, saveProgress, createInitialProgress, recordTechEvent } from "../../src/storage/progress";

const FORBIDDEN_KEYS = ["real_name", "realName", "studentNumber", "student_number", "email", "location", "photo", "video", "cameraFrame", "camera_frame", "microphone", "name"];

describe("익명 결과 내보내기 개인정보 시험", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("금지된 개인정보 필드를 포함하지 않는다", () => {
    getOrCreateSession("test-version", "test-marker-version");
    saveProgress({ ...createInitialProgress(1, "ar"), phase: "game" });
    saveAnswer(1, { questionId: "L1-Q01", responseCode: "A", correct: true, attempt: 1, score: 10, elapsedSeconds: 30 });
    recordTechEvent(1, "markerNotFound10s");

    const exported = buildAnonymousExport();
    const serialized = JSON.stringify(exported);

    for (const forbidden of FORBIDDEN_KEYS) {
      expect(serialized.toLowerCase().includes(forbidden.toLowerCase())).toBe(false);
    }
  });

  it("세션 ID는 무작위이며 실명을 담지 않는다(형식 검증)", () => {
    const session = getOrCreateSession("v1", "m1");
    expect(session.sessionId).not.toMatch(/[가-힣]/);
    expect(session.sessionId.length).toBeGreaterThan(8);
  });

  it("문항 응답은 선택 코드만 저장하고 자유서술 원문 필드를 갖지 않는다", () => {
    saveAnswer(2, { questionId: "L2-Q01", responseCode: "A", correct: true, attempt: 1, score: 10, elapsedSeconds: 20 });
    const exported = buildAnonymousExport();
    const lesson2 = exported.lessons.find((l) => l.lessonId === 2)!;
    const keys = Object.keys(lesson2.answers[0]);
    expect(keys.sort()).toEqual(["attempt", "correct", "elapsedSeconds", "questionId", "score"].sort());
  });
});
