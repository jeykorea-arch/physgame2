import type { AnonymousExport } from "../storage/export";

export interface QuestionAggregate {
  questionId: string;
  totalAnswered: number;
  firstAttemptCorrect: number;
  secondAttemptCorrect: number;
  resolvedByHint: number;
  firstAttemptAccuracyPct: number;
}

export interface LessonAggregate {
  lessonId: number;
  totalSessions: number;
  arSessions: number;
  nonArSessions: number;
  fallbackSelectedCount: number;
  exitCheckCorrectCount: number;
  exitCheckTotal: number;
  questions: QuestionAggregate[];
}

export interface AggregateResult {
  totalImportedFiles: number;
  lessons: LessonAggregate[];
}

export function aggregateResults(exportsList: AnonymousExport[]): AggregateResult {
  const lessonMap = new Map<number, LessonAggregate>();

  for (const exp of exportsList) {
    for (const lesson of exp.lessons) {
      if (!lesson.mode) continue; // 이 차시를 아직 하지 않은 세션은 집계에서 제외한다.
      let agg = lessonMap.get(lesson.lessonId);
      if (!agg) {
        agg = {
          lessonId: lesson.lessonId,
          totalSessions: 0,
          arSessions: 0,
          nonArSessions: 0,
          fallbackSelectedCount: 0,
          exitCheckCorrectCount: 0,
          exitCheckTotal: 0,
          questions: [],
        };
        lessonMap.set(lesson.lessonId, agg);
      }
      agg.totalSessions += 1;
      if (lesson.mode === "ar") agg.arSessions += 1;
      else agg.nonArSessions += 1;
      if (lesson.technicalEvents.some((e) => e.code === "fallbackSelected")) agg.fallbackSelectedCount += 1;
      if (lesson.exitCheckCorrect !== null) {
        agg.exitCheckTotal += 1;
        if (lesson.exitCheckCorrect) agg.exitCheckCorrectCount += 1;
      }

      for (const answer of lesson.answers) {
        let q = agg.questions.find((x) => x.questionId === answer.questionId);
        if (!q) {
          q = { questionId: answer.questionId, totalAnswered: 0, firstAttemptCorrect: 0, secondAttemptCorrect: 0, resolvedByHint: 0, firstAttemptAccuracyPct: 0 };
          agg.questions.push(q);
        }
        q.totalAnswered += 1;
        if (answer.attempt === 1 && answer.correct) q.firstAttemptCorrect += 1;
        else if (answer.attempt === 2 && answer.correct) q.secondAttemptCorrect += 1;
        else if (!answer.correct) q.resolvedByHint += 1;
      }
    }
  }

  for (const agg of lessonMap.values()) {
    for (const q of agg.questions) {
      q.firstAttemptAccuracyPct = q.totalAnswered > 0 ? (q.firstAttemptCorrect / q.totalAnswered) * 100 : 0;
    }
    agg.questions.sort((a, b) => a.questionId.localeCompare(b.questionId));
  }

  return {
    totalImportedFiles: exportsList.length,
    lessons: Array.from(lessonMap.values()).sort((a, b) => a.lessonId - b.lessonId),
  };
}

export function aggregateToCsv(result: AggregateResult): string {
  const rows = ["lessonId,questionId,totalAnswered,firstAttemptCorrect,secondAttemptCorrect,resolvedByHint,firstAttemptAccuracyPct"];
  for (const lesson of result.lessons) {
    for (const q of lesson.questions) {
      rows.push(`${lesson.lessonId},${q.questionId},${q.totalAnswered},${q.firstAttemptCorrect},${q.secondAttemptCorrect},${q.resolvedByHint},${q.firstAttemptAccuracyPct.toFixed(1)}`);
    }
  }
  return rows.join("\n");
}
