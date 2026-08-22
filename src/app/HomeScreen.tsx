import { useState } from "react";
import { isRealtimeAvailable } from "../realtime/firebaseClient";

interface HomeScreenProps {
  onSelectLesson: (lessonId: 1 | 2 | 3) => void;
  onJoinClass: (classCode: string, lessonId: 1 | 2 | 3) => void;
  onOpenTeacher: () => void;
}

const LESSONS: { id: 1 | 2 | 3; title: string; subtitle: string }[] = [
  { id: 1, title: "1차시 — 파동의 흔적", subtitle: "단일 슬릿 회절, 움직이는 음원 도플러 효과" },
  { id: 2, title: "2차시 — 전자기파의 선택", subtitle: "레이더 거리·방사 속도, 야기 안테나, LC 공명" },
  { id: 3, title: "3차시 — 양자의 증거", subtitle: "광전 효과, 전자 검출 누적, 불확정성, 확률 원자 모형" },
];

export function HomeScreen({ onSelectLesson, onJoinClass, onOpenTeacher }: HomeScreenProps) {
  const [classCode, setClassCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  async function joinByCode() {
    const code = classCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setJoinError("수업 코드는 숫자 6자리입니다.");
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const { getClassPublicInfo } = await import("../realtime/classSession");
      const info = await getClassPublicInfo(code);
      if (!info?.active) throw new Error("열려 있는 수업을 찾지 못했습니다.");
      onJoinClass(code, info.lessonId);
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : "수업 연결에 실패했습니다.");
      setJoining(false);
    }
  }

  return (
    <div className="screen">
      <div className="panel">
        <h1>PROJECT ECHO: 흔적 기록소</h1>
        <p>손상된 물리 기록을 복구하는 3차시 WebAR 학습 게임</p>
      </div>
      {LESSONS.map((lesson) => (
        <button key={lesson.id} className="panel" style={{ textAlign: "left", background: "var(--panel)" }} onClick={() => onSelectLesson(lesson.id)}>
          <h2 style={{ margin: 0 }}>{lesson.title}</h2>
          <p style={{ margin: "4px 0 0" }}>{lesson.subtitle}</p>
        </button>
      ))}
      {isRealtimeAvailable() && (
        <div className="panel">
          <h2>실시간 수업 코드로 참가</h2>
          <p className="qualitative-tag">교사 화면의 숫자 6자리를 입력하면 해당 차시로 연결됩니다.</p>
          <div className="code-join-row">
            <input
              value={classCode}
              onChange={(event) => setClassCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="6자리 수업 코드"
              placeholder="123456"
              maxLength={6}
            />
            <button disabled={joining || classCode.length !== 6} onClick={joinByCode}>참가</button>
          </div>
          {joinError && <p role="alert">{joinError}</p>}
        </div>
      )}
      <button className="secondary" onClick={onOpenTeacher}>
        교사용 화면 열기
      </button>
    </div>
  );
}
