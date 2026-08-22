interface HomeScreenProps {
  onSelectLesson: (lessonId: 1 | 2 | 3) => void;
  onOpenTeacher: () => void;
}

const LESSONS: { id: 1 | 2 | 3; title: string; subtitle: string }[] = [
  { id: 1, title: "1차시 — 파동의 흔적", subtitle: "단일 슬릿 회절, 움직이는 음원 도플러 효과" },
  { id: 2, title: "2차시 — 전자기파의 선택", subtitle: "레이더 거리·방사 속도, 야기 안테나, LC 공명" },
  { id: 3, title: "3차시 — 양자의 증거", subtitle: "광전 효과, 전자 검출 누적, 불확정성, 확률 원자 모형" },
];

export function HomeScreen({ onSelectLesson, onOpenTeacher }: HomeScreenProps) {
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
      <button className="secondary" onClick={onOpenTeacher}>
        교사용 화면 열기
      </button>
    </div>
  );
}
