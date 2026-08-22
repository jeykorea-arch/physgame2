import { useEffect, useState } from "react";
import { HomeScreen } from "./HomeScreen";
import { LessonScreen } from "../lessons/LessonScreen";
import { TeacherScreen } from "../teacher/TeacherScreen";

type Route = { name: "home" } | { name: "lesson"; lessonId: 1 | 2 | 3 } | { name: "teacher" };

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "");
  if (clean === "teacher") return { name: "teacher" };
  const match = clean.match(/^lesson\/(1|2|3)$/);
  if (match) return { name: "lesson", lessonId: Number(match[1]) as 1 | 2 | 3 };
  return { name: "home" };
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  // 선생님이 실시간 수업 QR을 만들면 주소가 ?class=123456#/lesson/1 형태가 된다.
  // 해시(#) 뒤가 아니라 앞의 쿼리 문자열이라 라우팅과 별개로 한 번만 읽는다.
  const [joinClassCode] = useState<string | null>(() => new URLSearchParams(window.location.search).get("class"));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigate(hash: string) {
    window.location.hash = hash;
  }

  if (route.name === "teacher") {
    return <TeacherScreen onGoHome={() => navigate("")} />;
  }
  if (route.name === "lesson") {
    return <LessonScreen lessonId={route.lessonId} joinClassCode={joinClassCode} onGoHome={() => navigate("")} />;
  }
  return <HomeScreen onSelectLesson={(id) => navigate(`lesson/${id}`)} onOpenTeacher={() => navigate("teacher")} />;
}
