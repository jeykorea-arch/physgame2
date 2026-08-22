import type { LessonMeta } from "../content/types";

export const TARGETS_MIND_PATH = "assets/targets.mind";

export function targetIndexForLesson(lessonMeta: LessonMeta): number {
  return lessonMeta.marker_target_index;
}
