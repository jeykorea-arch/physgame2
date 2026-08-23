import { describe, expect, it } from "vitest";
import { validateContentContract, validateLessonContent, validateMarkerManifest, type MarkerManifest } from "../../src/content/validator";
import type { ContentContract, LessonContent } from "../../src/content/types";
import contract from "../../public/data/content_contract.json";
import markerManifest from "../../public/data/marker_manifest.json";
import lesson1 from "../../public/data/content/lesson1.json";
import lesson2 from "../../public/data/content/lesson2.json";
import lesson3 from "../../public/data/content/lesson3.json";

const typedContract = contract as unknown as ContentContract;

describe("validateContentContract — 정상 계약", () => {
  it("실제 content_contract.json은 위반 사항이 없다", () => {
    expect(validateContentContract(typedContract)).toEqual([]);
  });

  it("실제 marker_manifest.json은 위반 사항이 없다", () => {
    expect(validateMarkerManifest(typedContract, markerManifest as unknown as MarkerManifest)).toEqual([]);
  });

  it("세 차시 콘텐츠 모두 위반 사항이 없다", () => {
    for (const lesson of [lesson1, lesson2, lesson3]) {
      expect(validateLessonContent(typedContract, lesson as unknown as LessonContent)).toEqual([]);
    }
  });

  it("1차시 첫 회상 문항은 상쇄 간섭이 성립하는 가정을 명시한다", () => {
    const prompt = (lesson1 as unknown as LessonContent).recallPrompts[0].prompt;
    expect(prompt).toContain("같은 진동수");
    expect(prompt).toContain("같은 진폭");
    expect(prompt).toContain("거리가 같");
  });

  it("2차시 학생 문항은 레이더·안테나 세부 평가를 제외하고 RLC 공진에 집중한다", () => {
    const content = lesson2 as unknown as LessonContent;
    const studentQuestionText = content.questions
      .flatMap((question) => [question.prompt, ...question.choices.map((choice) => choice.label)])
      .join(" ");
    const studentMissionText = content.missions
      .flatMap((mission) => [
        mission.title,
        mission.arObservationText,
        mission.predictionPrompt,
        mission.controlLabel,
        mission.verificationCaption,
        ...mission.predictionChoices.map((choice) => choice.label),
      ])
      .join(" ");
    expect(studentQuestionText).not.toMatch(/방사\s*속도|야기\s*안테나|주엽|대역폭|레이더/);
    expect(studentMissionText).not.toMatch(/방사\s*속도|야기\s*안테나|주엽|대역폭/);
    expect(content.questions).toHaveLength(4);
    expect(content.questions.every((question) => question.concept.startsWith("rlc_"))).toBe(true);
    expect(content.questions.map((question) => question.prompt).join(" ")).toContain("공진 주파수");
  });
});

describe("validateContentContract — 위반 fixture는 반드시 실패한다", () => {
  it("차시가 3개가 아니면 실패한다", () => {
    const broken: ContentContract = { ...typedContract, product: { ...typedContract.product, lesson_count: 2 } };
    const issues = validateContentContract(broken);
    expect(issues.some((i) => i.code === "LESSON_COUNT")).toBe(true);
  });

  it("차시당 핵심 문항이 4개가 아니면 실패한다", () => {
    const broken: ContentContract = {
      ...typedContract,
      lessons: typedContract.lessons.map((l, idx) => (idx === 0 ? { ...l, questions: l.questions.slice(0, 2) } : l)),
    };
    const issues = validateContentContract(broken);
    expect(issues.some((i) => i.code === "QUESTION_COUNT")).toBe(true);
  });

  it("중복 문항 ID가 있으면 실패한다", () => {
    const broken: ContentContract = {
      ...typedContract,
      lessons: typedContract.lessons.map((l, idx) =>
        idx === 1 ? { ...l, questions: [...l.questions, l.questions[0]] } : l
      ),
    };
    const issues = validateContentContract(broken);
    expect(issues.some((i) => i.code === "DUPLICATE_QUESTION_ID")).toBe(true);
  });

  it("필수 과학 불변 규칙이 누락되면 실패한다", () => {
    const broken: ContentContract = {
      ...typedContract,
      science_invariants: typedContract.science_invariants.filter((i) => i.id !== "SCI-WAVE-01"),
    };
    const issues = validateContentContract(broken);
    expect(issues.some((i) => i.code === "MISSING_SCIENCE_INVARIANT_ID")).toBe(true);
  });

  it("차시 핵심 활동 예상 시간 합계가 18분을 초과하면 실패한다", () => {
    const broken: ContentContract = {
      ...typedContract,
      lessons: typedContract.lessons.map((l, idx) =>
        idx === 0
          ? { ...l, missions: l.missions.map((m) => ({ ...m, estimated_seconds: m.estimated_seconds + 3000 })) }
          : l
      ),
    };
    const issues = validateContentContract(broken);
    expect(issues.some((i) => i.code === "CORE_PATH_OVER_18_MIN")).toBe(true);
  });
});

describe("validateMarkerManifest — 위반 fixture는 반드시 실패한다", () => {
  it("targetIndex가 일치하지 않으면 실패한다", () => {
    const typedManifest = markerManifest as unknown as MarkerManifest;
    const broken: MarkerManifest = {
      ...typedManifest,
      markers: typedManifest.markers.map((m) => (m.lesson === 1 ? { ...m, targetIndex: 9 } : m)),
    };
    const issues = validateMarkerManifest(typedContract, broken);
    expect(issues.length).toBeGreaterThan(0);
  });
});

describe("validateLessonContent — 위반 fixture는 반드시 실패한다", () => {
  it("정답 선택지가 choices에 없으면 실패한다", () => {
    const broken: LessonContent = {
      ...(lesson1 as unknown as LessonContent),
      questions: (lesson1 as unknown as LessonContent).questions.map((q, idx) =>
        idx === 0 ? { ...q, correctChoiceId: "D" as const, choices: q.choices.filter((c) => c.id !== "D") } : q
      ),
    };
    const issues = validateLessonContent(typedContract, broken);
    expect(issues.some((i) => i.code === "QUESTION_CORRECT_CHOICE_INVALID")).toBe(true);
  });
});
