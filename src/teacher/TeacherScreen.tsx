import { useEffect, useRef, useState } from "react";
import type { LessonContent } from "../content/types";
import { loadLessonContent } from "../content/loader";
import { aggregateResults, aggregateToCsv, type AggregateResult } from "./aggregate";
import type { AnonymousExport } from "../storage/export";
import { MarkerPrintSheet } from "./MarkerPrintSheet";
import { RealtimeClassPanel } from "../realtime/RealtimeClassPanel";
import { LESSON_LIVE_META } from "../realtime/teacherDashboard";

const TIMELINE = [
  { label: "진입", minutes: 3 },
  { label: "선수학습 회상", minutes: 5 },
  { label: "핵심 게임(20분 강제 종료)", minutes: 20 },
  { label: "정확한 설명", minutes: 13 },
  { label: "확인", minutes: 3 },
  { label: "저장", minutes: 1 },
];

function currentSegment(elapsedMin: number) {
  let acc = 0;
  for (const seg of TIMELINE) {
    acc += seg.minutes;
    if (elapsedMin < acc) return seg.label;
  }
  return "종료";
}

export function TeacherScreen({ onGoHome }: { onGoHome: () => void }) {
  const [lessonId, setLessonId] = useState<1 | 2 | 3>(1);
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [aggregate, setAggregate] = useState<AggregateResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadLessonContent(lessonId).then(setLessonContent).catch(() => setLessonContent(null));
  }, [lessonId]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const parsed: AnonymousExport[] = [];
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        parsed.push(JSON.parse(text) as AnonymousExport);
      } catch {
        // 잘못된 파일은 건너뛴다.
      }
    }
    setAggregate(aggregateResults(parsed));
  }

  function downloadCsv() {
    if (!aggregate) return;
    const blob = new Blob([aggregateToCsv(aggregate)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project-echo-aggregate.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadJson() {
    if (!aggregate) return;
    const blob = new Blob([JSON.stringify(aggregate, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project-echo-aggregate.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const elapsedMin = Math.floor(elapsedSeconds / 60);
  const elapsedSec = elapsedSeconds % 60;

  return (
    <div className="screen teacher-screen">
      <div className="panel teacher-console-header">
        <div>
          <span className="teacher-eyebrow">PROJECT ECHO · TEACHER CONSOLE</span>
          <h1>교사용 수업 화면</h1>
          <p>차시 선택 → 실시간 수업 열기 → QR 제시 → 닉네임별 진행 확인</p>
        </div>
        <button className="secondary" onClick={onGoHome}>
          학생 화면으로
        </button>
      </div>

      <nav className="teacher-lesson-tabs" aria-label="QR과 진행 현황을 표시할 차시 선택">
        {([1, 2, 3] as const).map((id) => (
          <button key={id} className={lessonId === id ? "active" : ""} onClick={() => setLessonId(id)}>
            <strong>{id}차시</strong>
            <span>{LESSON_LIVE_META[id].title}</span>
          </button>
        ))}
      </nav>

      <RealtimeClassPanel lessonId={lessonId} />

      <div className="panel">
        <h2>45분 타이머</h2>
        <p style={{ fontSize: "2rem", margin: 0 }}>
          {elapsedMin}분 {elapsedSec.toString().padStart(2, "0")}초
        </p>
        <p>
          현재 단계: <strong>{currentSegment(elapsedMin)}</strong>
        </p>
        <div className="timer-bar">
          <div style={{ width: `${Math.min(100, (elapsedSeconds / (45 * 60)) * 100)}%` }} />
        </div>
        <button onClick={() => setRunning((r) => !r)}>{running ? "일시정지" : "시작"}</button>
        <button
          className="secondary"
          onClick={() => {
            setRunning(false);
            setElapsedSeconds(0);
          }}
        >
          초기화
        </button>
      </div>

      <MarkerPrintSheet />

      <div className="panel">
        <h2>{lessonId}차시 설명 카드</h2>
        {lessonContent?.teacherExplanationCards.map((card, i) => (
          <div className="feedback-box" key={i} style={{ marginTop: 8 }}>
            <strong>{card.title}</strong>
            <p>{card.body}</p>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>학생 결과 불러오기</h2>
        <p>학생이 내보낸 익명 결과 JSON 여러 개를 한 번에 불러올 수 있습니다.</p>
        <input ref={fileInputRef} type="file" accept="application/json" multiple onChange={(e) => handleFiles(e.target.files)} />
        {aggregate && (
          <>
            <p>불러온 파일 {aggregate.totalImportedFiles}개</p>
            {aggregate.lessons.map((lesson) => (
              <div key={lesson.lessonId} style={{ marginBottom: 12 }}>
                <h3>{lesson.lessonId}차시</h3>
                <p>
                  세션 {lesson.totalSessions} · AR {lesson.arSessions} · 비AR {lesson.nonArSessions} · 비AR 전환{" "}
                  {lesson.fallbackSelectedCount}
                </p>
                {lesson.exitCheckTotal > 0 && (
                  <p>
                    출구 확인 정답률: {((lesson.exitCheckCorrectCount / lesson.exitCheckTotal) * 100).toFixed(1)}%
                  </p>
                )}
                <div style={{ overflowX: "auto" }}>
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>문항</th>
                        <th>응답 수</th>
                         <th>첫 시도 정답률</th>
                          <th>2차 시도 정답</th>
                          <th>원리 안내 완료</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lesson.questions.map((q) => (
                        <tr key={q.questionId}>
                          <td>{q.questionId}</td>
                          <td>{q.totalAnswered}</td>
                          <td>{q.firstAttemptAccuracyPct.toFixed(1)}%</td>
                          <td>{q.secondAttemptCorrect}</td>
                          <td>{q.resolvedByHint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            <button onClick={downloadCsv}>CSV 내보내기</button>
            <button className="secondary" onClick={downloadJson}>
              JSON 내보내기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
