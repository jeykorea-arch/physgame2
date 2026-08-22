/** 저장 키는 기존 physgame과 겹치지 않도록 physgame2.project-echo.*만 사용한다(docs/03 11절). */
export const STORAGE_PREFIX = "physgame2.project-echo";

export const storageKey = {
  session: () => `${STORAGE_PREFIX}.session`,
  progress: (lessonId: number) => `${STORAGE_PREFIX}.progress.lesson${lessonId}`,
  answers: (lessonId: number) => `${STORAGE_PREFIX}.answers.lesson${lessonId}`,
  techEvents: (lessonId: number) => `${STORAGE_PREFIX}.techEvents.lesson${lessonId}`,
  exitCheck: (lessonId: number) => `${STORAGE_PREFIX}.exitCheck.lesson${lessonId}`,
  realtimeJoin: () => `${STORAGE_PREFIX}.realtimeJoin`,
};
