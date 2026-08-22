/** data/content_contract.json과 data/content/lessonN.json의 타입 정의. UI는 이 타입만 참조한다. */

export interface ScienceInvariant {
  id: string;
  rule: string;
}

export interface MissionMeta {
  id: string;
  title: string;
  primary_control: string;
  fixed_variables: string[];
  model: string;
  estimated_seconds: number;
}

export interface QuestionMeta {
  id: string;
  type: "classification" | "direction" | "numeric" | "explanation" | "evidence" | "concept";
  concept: string;
  expected_seconds: number;
}

export interface LessonMeta {
  id: 1 | 2 | 3;
  marker_target_index: 0 | 1 | 2;
  title: string;
  review: string[];
  missions: MissionMeta[];
  questions: QuestionMeta[];
  teacher_explanation_focus: string[];
}

export interface ContentContract {
  schema_version: string;
  content_version: string;
  product: {
    title: string;
    subject: string;
    lesson_count: number;
    usable_minutes_per_lesson: number;
    game_minutes_per_lesson: number;
    required_questions_per_lesson: number;
    required_question_total: number;
  };
  timeline_minutes: Record<string, number>;
  prior_learning: string[];
  excluded_from_main_game: string[];
  science_invariants: ScienceInvariant[];
  lessons: LessonMeta[];
  privacy: {
    allowed_local: string[];
    forbidden: string[];
    external_services_default: string;
  };
  release_blockers: string[];
}

export type ChoiceId = "A" | "B" | "C" | "D";

export interface QuestionChoice {
  id: ChoiceId;
  label: string;
}

/** 오답 피드백은 "틀림"이 아니라 어떤 변수·현상을 잘못 연결했는지 알려준다(docs/02 공통 피드백 문체). */
export interface QuestionContent {
  id: string;
  concept: string;
  prompt: string;
  choices: QuestionChoice[];
  correctChoiceId: ChoiceId;
  correctFeedback: string;
  incorrectFeedback: Record<ChoiceId, string>;
  misconceptionTag: string;
  expectedSeconds: number;
}

export interface MissionScreenContent {
  id: string;
  title: string;
  arObservationText: string;
  predictionPrompt: string;
  predictionChoices: QuestionChoice[];
  correctPredictionChoiceId: ChoiceId;
  controlLabel: string;
  controlMin: number;
  controlMax: number;
  controlStep: number;
  controlDefault: number;
  controlUnit: string;
  verificationCaption: string;
  qualitativeModelNotice?: string;
  estimatedSeconds: number;
  /** 슬라이더 대신 이산 값(예: 누적 전자 수 1/20/200/2000)을 순서대로 보여줄 때 사용한다. */
  discreteValues?: number[];
  /** "boss"는 앞선 증거를 연결하는 서술 확인 화면이며 점수화된 4문항에 포함되지 않는다. */
  kind?: "slider" | "boss";
  bossNarrative?: string;
}

export interface LessonContent {
  lessonId: 1 | 2 | 3;
  contentVersion: string;
  markerVersion: string;
  storyIntro: string;
  recallPrompts: { id: string; prompt: string; correctChoiceId: ChoiceId; choices: QuestionChoice[] }[];
  /** 보스 활동 등 채점되지 않는 확인 질문(선택). */
  bossCheck?: { id: string; prompt: string; correctChoiceId: ChoiceId; choices: QuestionChoice[] };
  missions: MissionScreenContent[];
  questions: QuestionContent[];
  exitCheckPrompt: string;
  /** 출구 확인은 자유서술 대신 자동 채점 가능한 선택형으로 기록한다(자유서술 원문 미저장 원칙). */
  exitCheckQuestion: { id: string; prompt: string; correctChoiceId: ChoiceId; choices: QuestionChoice[] };
  teacherExplanationCards: { title: string; body: string; misconceptionTag: string }[];
}
