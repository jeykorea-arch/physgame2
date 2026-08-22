/**
 * content_contract.json, marker_manifest.json, lessonN.json의 정합성을 검사한다.
 * docs/03_기술설계.md 7절, docs/04_인수기준과_완료정의.md 단계 1 게이트를 코드로 강제한다.
 * 빌드 스크립트(scripts/validate-content.mjs)와 단위 시험 양쪽에서 이 함수를 사용한다.
 */
import type { ContentContract, LessonContent } from "./types";

export interface MarkerManifest {
  schema_version: string;
  version: string;
  target_count: number;
  targets_file: string;
  targets_bytes: number;
  markers: {
    targetIndex: number;
    file: string;
    lesson: number;
    sha256: string;
  }[];
}

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

function issue(code: string, message: string): ValidationIssue {
  return { code, message };
}

export function validateContentContract(contract: ContentContract): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (contract.product.lesson_count !== 3) {
    issues.push(issue("LESSON_COUNT", `차시는 정확히 3개여야 한다. 현재 ${contract.product.lesson_count}`));
  }
  if (contract.lessons.length !== contract.product.lesson_count) {
    issues.push(
      issue("LESSON_ARRAY_MISMATCH", `lessons 배열 길이(${contract.lessons.length})가 lesson_count와 다르다`)
    );
  }

  const seenLessonIds = new Set<number>();
  const seenQuestionIds = new Set<string>();
  const seenMissionIds = new Set<string>();

  for (const lesson of contract.lessons) {
    if (seenLessonIds.has(lesson.id)) {
      issues.push(issue("DUPLICATE_LESSON_ID", `차시 ID 중복: ${lesson.id}`));
    }
    seenLessonIds.add(lesson.id);

    if (lesson.questions.length !== contract.product.required_questions_per_lesson) {
      issues.push(
        issue(
          "QUESTION_COUNT",
          `차시 ${lesson.id}의 핵심 문항은 정확히 ${contract.product.required_questions_per_lesson}개여야 한다. 현재 ${lesson.questions.length}`
        )
      );
    }

    for (const q of lesson.questions) {
      if (seenQuestionIds.has(q.id)) {
        issues.push(issue("DUPLICATE_QUESTION_ID", `문항 ID 중복: ${q.id}`));
      }
      seenQuestionIds.add(q.id);
      if (!(q.expected_seconds > 0)) {
        issues.push(issue("MISSING_EXPECTED_SECONDS", `문항 ${q.id}에 예상 시간이 없다`));
      }
    }

    for (const m of lesson.missions) {
      if (seenMissionIds.has(m.id)) {
        issues.push(issue("DUPLICATE_MISSION_ID", `미션 ID 중복: ${m.id}`));
      }
      seenMissionIds.add(m.id);
      if (!(m.estimated_seconds > 0)) {
        issues.push(issue("MISSING_ESTIMATED_SECONDS", `미션 ${m.id}에 예상 시간이 없다`));
      }
    }

    const missionSeconds = lesson.missions.reduce((sum, m) => sum + m.estimated_seconds, 0);
    const questionSeconds = lesson.questions.reduce((sum, q) => sum + q.expected_seconds, 0);
    const totalMinutes = (missionSeconds + questionSeconds) / 60;
    if (totalMinutes > 18) {
      issues.push(
        issue(
          "CORE_PATH_OVER_18_MIN",
          `차시 ${lesson.id} 핵심 활동 예상 시간 합계가 18분을 초과한다 (${totalMinutes.toFixed(2)}분)`
        )
      );
    }
  }

  const requiredTotal = contract.lessons.reduce((sum, l) => sum + l.questions.length, 0);
  if (requiredTotal !== contract.product.required_question_total) {
    issues.push(
      issue(
        "REQUIRED_TOTAL_MISMATCH",
        `전체 핵심 문항 합계(${requiredTotal})가 required_question_total(${contract.product.required_question_total})과 다르다`
      )
    );
  }

  if (contract.science_invariants.length === 0) {
    issues.push(issue("MISSING_SCIENCE_INVARIANTS", "science_invariants가 비어 있다"));
  }
  const REQUIRED_INVARIANT_IDS = [
    "SCI-NC-01",
    "SCI-WAVE-01",
    "SCI-WAVE-02",
    "SCI-RADAR-01",
    "SCI-ANT-01",
    "SCI-LC-01",
    "SCI-EM-01",
    "SCI-PE-01",
    "SCI-PE-02",
    "SCI-DUAL-01",
    "SCI-UNC-01",
    "SCI-ATOM-01",
  ];
  const presentIds = new Set(contract.science_invariants.map((i) => i.id));
  for (const id of REQUIRED_INVARIANT_IDS) {
    if (!presentIds.has(id)) {
      issues.push(issue("MISSING_SCIENCE_INVARIANT_ID", `필수 과학 불변 규칙 누락: ${id}`));
    }
  }

  for (const forbidden of contract.privacy.forbidden) {
    if (contract.privacy.allowed_local.includes(forbidden)) {
      issues.push(issue("PRIVACY_CONTRADICTION", `${forbidden}이 forbidden과 allowed_local에 동시에 있다`));
    }
  }

  return issues;
}

export function validateMarkerManifest(contract: ContentContract, manifest: MarkerManifest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (manifest.target_count !== contract.lessons.length) {
    issues.push(
      issue(
        "MARKER_COUNT_MISMATCH",
        `마커 수(${manifest.target_count})가 차시 수(${contract.lessons.length})와 다르다`
      )
    );
  }
  if (manifest.markers.length !== manifest.target_count) {
    issues.push(issue("MARKER_ARRAY_MISMATCH", "markers 배열 길이가 target_count와 다르다"));
  }

  const sortedIndexes = manifest.markers.map((m) => m.targetIndex).sort((a, b) => a - b);
  sortedIndexes.forEach((idx, i) => {
    if (idx !== i) {
      issues.push(issue("MARKER_TARGET_INDEX_GAP", `targetIndex가 0부터 연속하지 않는다: ${sortedIndexes.join(",")}`));
    }
  });

  for (const lesson of contract.lessons) {
    const marker = manifest.markers.find((m) => m.lesson === lesson.id);
    if (!marker) {
      issues.push(issue("MARKER_LESSON_MISSING", `차시 ${lesson.id}에 대응하는 마커가 없다`));
      continue;
    }
    if (marker.targetIndex !== lesson.marker_target_index) {
      issues.push(
        issue(
          "MARKER_TARGET_INDEX_MISMATCH",
          `차시 ${lesson.id}의 marker_target_index(${lesson.marker_target_index})가 manifest(${marker.targetIndex})와 다르다`
        )
      );
    }
    if (!marker.sha256 || marker.sha256.length < 32) {
      issues.push(issue("MARKER_HASH_MISSING", `차시 ${lesson.id} 마커에 유효한 sha256 해시가 없다`));
    }
  }

  return issues;
}

export function validateLessonContent(contract: ContentContract, lesson: LessonContent): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lessonMeta = contract.lessons.find((l) => l.id === lesson.lessonId);
  if (!lessonMeta) {
    issues.push(issue("LESSON_META_NOT_FOUND", `content_contract.json에 차시 ${lesson.lessonId} 정의가 없다`));
    return issues;
  }

  const metaQuestionIds = new Set(lessonMeta.questions.map((q) => q.id));
  const contentQuestionIds = new Set(lesson.questions.map((q) => q.id));
  for (const id of metaQuestionIds) {
    if (!contentQuestionIds.has(id)) {
      issues.push(issue("QUESTION_CONTENT_MISSING", `차시 ${lesson.lessonId} 문항 ${id}의 콘텐츠가 없다`));
    }
  }

  for (const q of lesson.questions) {
    if (!q.prompt || q.prompt.trim().length === 0) {
      issues.push(issue("QUESTION_MISSING_PROMPT", `문항 ${q.id}에 지문이 없다`));
    }
    if (!q.correctFeedback || q.correctFeedback.trim().length === 0) {
      issues.push(issue("QUESTION_MISSING_CORRECT_FEEDBACK", `문항 ${q.id}에 정답 피드백이 없다`));
    }
    const choiceIds = new Set(q.choices.map((c) => c.id));
    if (!choiceIds.has(q.correctChoiceId)) {
      issues.push(issue("QUESTION_CORRECT_CHOICE_INVALID", `문항 ${q.id}의 정답 선택지가 choices에 없다`));
    }
    for (const choiceId of choiceIds) {
      if (choiceId === q.correctChoiceId) continue;
      if (!q.incorrectFeedback[choiceId] || q.incorrectFeedback[choiceId].trim().length === 0) {
        issues.push(issue("QUESTION_MISSING_INCORRECT_FEEDBACK", `문항 ${q.id}의 선택지 ${choiceId} 오답 피드백이 없다`));
      }
    }
    if (!q.misconceptionTag) {
      issues.push(issue("QUESTION_MISSING_MISCONCEPTION_TAG", `문항 ${q.id}에 오개념 태그가 없다`));
    }
  }

  if (!lesson.exitCheckQuestion) {
    issues.push(issue("EXIT_CHECK_MISSING", `차시 ${lesson.lessonId}에 exitCheckQuestion이 없다`));
  } else {
    const choiceIds = new Set(lesson.exitCheckQuestion.choices.map((c) => c.id));
    if (!choiceIds.has(lesson.exitCheckQuestion.correctChoiceId)) {
      issues.push(issue("EXIT_CHECK_CORRECT_CHOICE_INVALID", `차시 ${lesson.lessonId}의 출구 확인 정답 선택지가 choices에 없다`));
    }
  }

  return issues;
}

export function summarize(result: { code: string; message: string }[]): ValidationResult {
  return { valid: result.length === 0, issues: result };
}
