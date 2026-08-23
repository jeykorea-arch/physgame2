import { beforeEach, describe, expect, it } from "vitest";
import lesson1 from "../../public/data/content/lesson1.json";
import type { LessonContent } from "../../src/content/types";
import { deriveGameRestoreState } from "../../src/lessons/game-progress";
import {
  clearLessonProgress,
  createInitialProgress,
  loadAnswers,
  loadProgress,
  loadTechEvents,
  recordTechEvent,
  saveAnswer,
  saveExitCheckChoice,
  saveProgress,
} from "../../src/storage/progress";

const content = lesson1 as unknown as LessonContent;

describe("게임 진행 복원", () => {
  beforeEach(() => localStorage.clear());

  it("완료한 첫 미션 뒤에는 두 번째 미션으로 복원한다", () => {
    const progress = {
      ...createInitialProgress(1, "non-ar"),
      phase: "game" as const,
      gameStage: "missions" as const,
      missionId: "L1-M2",
      completedMissionIds: ["L1-M1"],
      elapsedGameSeconds: 26,
    };
    const restored = deriveGameRestoreState(content, progress, []);
    expect(restored.stage).toBe("missions");
    expect(restored.missionIndex).toBe(1);
    expect(restored.completedMissionIds).toEqual(["L1-M1"]);
  });

  it("문항 진행과 기존 점수를 복원한다", () => {
    const progress = {
      ...createInitialProgress(1, "non-ar"),
      phase: "game" as const,
      gameStage: "questions" as const,
      questionId: "L1-Q02",
      completedMissionIds: content.missions.map((mission) => mission.id),
      completedQuestionIds: ["L1-Q01"],
    };
    const restored = deriveGameRestoreState(content, progress, [
      { questionId: "L1-Q01", responseCode: "A", correct: true, attempt: 1, score: 10, elapsedSeconds: 20 },
    ]);
    expect(restored.stage).toBe("questions");
    expect(restored.questionIndex).toBe(1);
    expect(restored.totalScore).toBe(10);
  });

  it("관찰 중 저장한 기록은 관찰 단계에 머문다", () => {
    const progress = { ...createInitialProgress(1, "ar"), phase: "game" as const, gameStage: "observe" as const };
    expect(deriveGameRestoreState(content, progress, []).stage).toBe("observe");
  });

  it("처음부터 다시 시작하면 현재 차시의 진행·답안·기술 기록·출구 결과를 모두 지운다", () => {
    saveProgress({ ...createInitialProgress(1, "ar"), phase: "game", completedMissionIds: ["L1-M1"] });
    saveAnswer(1, { questionId: "L1-Q01", responseCode: "A", correct: true, attempt: 1, score: 10, elapsedSeconds: 20 });
    recordTechEvent(1, "fallbackSelected");
    saveExitCheckChoice(1, true);
    saveProgress({ ...createInitialProgress(2, "non-ar"), phase: "recall" });

    clearLessonProgress(1);

    expect(loadProgress(1)).toBeNull();
    expect(loadAnswers(1)).toEqual([]);
    expect(loadTechEvents(1)).toEqual([]);
    expect(localStorage.getItem("physgame2.project-echo.exitCheck.lesson1")).toBeNull();
    expect(loadProgress(2)?.phase).toBe("recall");
  });
});
