import { describe, expect, it } from "vitest";
import type { AnonymousExport } from "../../src/storage/export";
import { aggregateResults, aggregateToCsv } from "../../src/teacher/aggregate";

function exportFixture(): AnonymousExport {
  return {
    schemaVersion: "1.0",
    exportedAt: "2026-08-22T00:00:00.000Z",
    session: null,
    lessons: [
      {
        lessonId: 1,
        mode: "non-ar",
        phase: "complete",
        completedQuestionCount: 3,
        answers: [
          { questionId: "L1-Q01", correct: true, attempt: 1, score: 10, elapsedSeconds: 10 },
          { questionId: "L1-Q02", correct: true, attempt: 2, score: 7, elapsedSeconds: 20 },
          { questionId: "L1-Q03", correct: false, attempt: 2, score: 5, elapsedSeconds: 30 },
        ],
        exitCheckCorrect: true,
        technicalEvents: [],
      },
      ...([2, 3].map((lessonId) => ({
        lessonId,
        mode: null,
        phase: null,
        completedQuestionCount: 0,
        answers: [],
        exitCheckCorrect: null,
        technicalEvents: [],
      })) as AnonymousExport["lessons"]),
    ],
  };
}

describe("교사용 시도 분포 집계", () => {
  it("1차 정답·2차 정답·원리 안내 완료를 분리한다", () => {
    const result = aggregateResults([exportFixture()]);
    const questions = result.lessons[0].questions;
    expect(questions[0]).toMatchObject({ firstAttemptCorrect: 1, secondAttemptCorrect: 0, resolvedByHint: 0 });
    expect(questions[1]).toMatchObject({ firstAttemptCorrect: 0, secondAttemptCorrect: 1, resolvedByHint: 0 });
    expect(questions[2]).toMatchObject({ firstAttemptCorrect: 0, secondAttemptCorrect: 0, resolvedByHint: 1 });
    expect(aggregateToCsv(result)).toContain("secondAttemptCorrect,resolvedByHint");
  });
});
