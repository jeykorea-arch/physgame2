export type Route = { name: "home" } | { name: "lesson"; lessonId: 1 | 2 | 3 } | { name: "teacher" };

/** physgame과 같은 쿼리 주소를 우선하고 기존 hash 주소도 호환한다. */
export function parseRoute(href: string): Route {
  const url = new URL(href);
  if (url.searchParams.get("teacher") === "1") return { name: "teacher" };

  const queryLesson = url.searchParams.get("lesson");
  if (/^[123]$/.test(queryLesson ?? "")) {
    return { name: "lesson", lessonId: Number(queryLesson) as 1 | 2 | 3 };
  }

  const cleanHash = url.hash.replace(/^#\/?/, "");
  if (cleanHash === "teacher") return { name: "teacher" };
  const hashLesson = cleanHash.match(/^lesson\/(1|2|3)$/);
  if (hashLesson) return { name: "lesson", lessonId: Number(hashLesson[1]) as 1 | 2 | 3 };
  return { name: "home" };
}
