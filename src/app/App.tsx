import { useEffect, useState } from "react";
import { HomeScreen } from "./HomeScreen";
import { LessonScreen } from "../lessons/LessonScreen";
import { TeacherScreen } from "../teacher/TeacherScreen";
import { parseRoute, type Route } from "./routing";

export function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.href));
  // physgame과 같은 ?lesson=1&class=123456 QR 주소의 수업 코드를 읽는다.
  const [joinClassCode, setJoinClassCode] = useState<string | null>(() => new URLSearchParams(window.location.search).get("class"));

  useEffect(() => {
    const onLocationChange = () => setRoute(parseRoute(window.location.href));
    window.addEventListener("hashchange", onLocationChange);
    window.addEventListener("popstate", onLocationChange);
    return () => {
      window.removeEventListener("hashchange", onLocationChange);
      window.removeEventListener("popstate", onLocationChange);
    };
  }, []);

  function navigate(hash: string) {
    window.location.hash = hash;
  }

  function goHome() {
    const url = new URL(window.location.href);
    url.searchParams.delete("class");
    url.searchParams.delete("lesson");
    url.searchParams.delete("teacher");
    url.hash = "";
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    setJoinClassCode(null);
    setRoute({ name: "home" });
  }

  function joinRealtimeClass(classCode: string, lessonId: 1 | 2 | 3) {
    const url = new URL(window.location.href);
    url.searchParams.delete("teacher");
    url.searchParams.set("class", classCode);
    url.searchParams.set("lesson", String(lessonId));
    url.hash = "";
    window.location.assign(url.toString());
  }

  if (route.name === "teacher") {
    return <TeacherScreen onGoHome={goHome} />;
  }
  if (route.name === "lesson") {
    return <LessonScreen lessonId={route.lessonId} joinClassCode={joinClassCode} onGoHome={goHome} />;
  }
  return <HomeScreen onSelectLesson={(id) => navigate(`lesson/${id}`)} onJoinClass={joinRealtimeClass} onOpenTeacher={() => navigate("teacher")} />;
}
