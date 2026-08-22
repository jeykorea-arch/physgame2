import { useEffect, useMemo, useRef, useState } from "react";
import { isRealtimeAvailable } from "./firebaseClient";
import type { StudentRealtimeRecord } from "./types";
import {
  buildLessonEntryUrl,
  buildStudentJoinUrl,
  isStudentOnline,
  LESSON_LIVE_META,
  progressLabel,
  progressPercent,
  summarizeRoster,
} from "./teacherDashboard";

interface RealtimeClassPanelProps {
  lessonId: 1 | 2 | 3;
}

const STORED_CLASS_CODE_KEY = "physgame2.project-echo.teacher.live-class-code";

interface LessonQrCardProps {
  lessonId: 1 | 2 | 3;
  url: string;
  qrDataUrl: string | null;
  classCode?: string;
  tracked: boolean;
  onCopy: () => void;
}

function LessonQrCard({ lessonId, url, qrDataUrl, classCode, tracked, onCopy }: LessonQrCardProps) {
  return (
    <div className="qr-display">
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt={tracked ? `${lessonId}차시 실시간 수업 접속 QR 코드` : `${lessonId}차시 수업 바로 접속 QR 코드`}
          width={280}
          height={280}
        />
      ) : (
        <div className="qr-placeholder">QR 생성 중…</div>
      )}
      {tracked && classCode && (
        <div className="class-code-display"><span>직접 입력 코드</span><strong>{classCode}</strong></div>
      )}
      <button className="secondary compact" onClick={onCopy}>접속 주소 복사</button>
      <a href={url} target="_blank" rel="noreferrer">{url}</a>
      <p>
        {tracked
          ? "학생은 이 QR 또는 6자리 코드로 들어오면 진행판에 표시됩니다."
          : `학생이 이 QR을 찍으면 ${lessonId}차시 게임 입구로 바로 들어갑니다.`}
      </p>
    </div>
  );
}

/** 교사용 실시간 수업 열기·차시별 QR·익명 학생 진행 현황. */
export function RealtimeClassPanel({ lessonId }: RealtimeClassPanelProps) {
  const available = isRealtimeAvailable();
  const [classCode, setClassCode] = useState(() => localStorage.getItem(STORED_CLASS_CODE_KEY) ?? "");
  const [liveOpen, setLiveOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [roster, setRoster] = useState<Record<string, StudentRealtimeRecord>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("차시 QR을 바로 사용할 수 있습니다. 실시간 수업을 열면 접속·진행 현황도 표시됩니다.");
  const [now, setNow] = useState(() => Date.now());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const directLessonUrl = buildLessonEntryUrl(window.location.href, lessonId);
  const entryUrl = liveOpen && classCode
    ? buildStudentJoinUrl(window.location.href, classCode, lessonId)
    : directLessonUrl;
  const lessonMeta = LESSON_LIVE_META[lessonId];
  const summary = useMemo(() => summarizeRoster(roster, lessonId, now), [roster, lessonId, now]);
  const students = useMemo(
    () =>
      Object.entries(roster)
        .filter(([, student]) => student.lessonId === lessonId)
        .sort(([, a], [, b]) => {
          const onlineDifference = Number(isStudentOnline(b, now)) - Number(isStudentOnline(a, now));
          return onlineDifference || progressPercent(b) - progressPercent(a) || a.alias.localeCompare(b.alias);
        }),
    [roster, lessonId, now],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => unsubscribeRef.current?.();
  }, []);

  useEffect(() => {
    if (!available || !liveOpen || !classCode) return;
    let cancelled = false;
    import("./classSession")
      .then(({ setClassLesson }) => setClassLesson(classCode, lessonId))
      .then(() => {
        if (!cancelled) setStatus(`${lessonId}차시 QR과 진행 현황을 표시 중입니다.`);
      })
      .catch((error) => {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "차시 변경을 전송하지 못했습니다.");
      });
    return () => {
      cancelled = true;
    };
  }, [available, classCode, lessonId, liveOpen]);

  useEffect(() => {
    let cancelled = false;
    import("qrcode")
      .then((QRCode) => QRCode.toDataURL(entryUrl, { width: 320, margin: 2, color: { dark: "#07141d", light: "#ffffff" } }))
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setStatus("QR 생성에 실패했습니다. 아래 접속 주소를 안내해 주세요.");
      });
    return () => {
      cancelled = true;
    };
  }, [entryUrl]);

  if (!available) {
    return (
      <section className="panel realtime-board realtime-setup-panel" aria-labelledby="realtime-title">
        <div className="realtime-heading">
          <div>
            <span className="teacher-eyebrow">LESSON {lessonId} · STUDENT QR</span>
            <h2 id="realtime-title">{lessonId}차시 학생 접속 QR</h2>
            <p>{lessonMeta.title}</p>
          </div>
          <div className="live-indicator"><span aria-hidden="true" />QR 사용 가능</div>
        </div>
        <div className="realtime-entry-grid">
          <LessonQrCard
            lessonId={lessonId}
            url={entryUrl}
            qrDataUrl={qrDataUrl}
            tracked={false}
            onCopy={copyJoinUrl}
          />
          <div className="realtime-closed">
            <div>
              <h3>지금 바로 수업할 수 있습니다</h3>
              <p>학생이 QR을 찍으면 선택한 {lessonId}차시 게임 화면으로 들어갑니다.</p>
              <p>현재 빌드는 실시간 연결값이 없어 접속 현황과 진행률 추적만 꺼져 있습니다.</p>
              <p className="setup-path">추적 기능 설정: <strong>dist/firebase-config.json</strong> 또는 <strong>firebase/README.md</strong></p>
            </div>
          </div>
        </div>
        <p className="live-status-copy" role="status">{status}</p>
      </section>
    );
  }

  async function openClassNow() {
    setBusy(true);
    setStatus("실시간 수업을 여는 중입니다…");
    try {
      const { openTeacherClass, subscribeToClassRoster } = await import("./classSession");
      const opened = await openTeacherClass(lessonId, classCode);
      setClassCode(opened.classCode);
      localStorage.setItem(STORED_CLASS_CODE_KEY, opened.classCode);
      unsubscribeRef.current?.();
      unsubscribeRef.current = await subscribeToClassRoster(
        opened.classCode,
        setRoster,
        (message) => setStatus(`접속 현황을 읽지 못했습니다: ${message}`),
      );
      setLiveOpen(true);
      setStatus(`${lessonId}차시 실시간 수업이 열렸습니다.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "실시간 수업을 열지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function closeClassNow() {
    if (!classCode || !window.confirm("현재 실시간 수업을 종료할까요? 학생의 기기 내 학습 기록은 유지됩니다.")) return;
    setBusy(true);
    try {
      const { closeClass } = await import("./classSession");
      await closeClass(classCode);
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      setLiveOpen(false);
      setRoster({});
      setStatus("실시간 수업이 종료되었습니다. 같은 코드로 다시 열 수 있습니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "실시간 수업을 종료하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function copyJoinUrl() {
    try {
      await navigator.clipboard.writeText(entryUrl);
      setStatus("학생 접속 주소를 복사했습니다.");
    } catch {
      setStatus("주소를 복사하지 못했습니다. QR 아래 주소를 길게 눌러 복사해 주세요.");
    }
  }

  return (
    <section className="panel realtime-board" aria-labelledby="realtime-title">
      <div className="realtime-heading">
        <div>
          <span className="teacher-eyebrow">LIVE CLASS · LESSON {lessonId}</span>
          <h2 id="realtime-title">{lessonId}차시 QR·실시간 진행판</h2>
          <p>{lessonMeta.title}</p>
        </div>
        <div className={`live-indicator ${liveOpen ? "open" : ""}`}>
          <span aria-hidden="true" />{liveOpen ? "수업 진행 중" : "수업 대기"}
        </div>
      </div>

      {!liveOpen ? (
        <div className="realtime-entry-grid">
          <LessonQrCard
            lessonId={lessonId}
            url={entryUrl}
            qrDataUrl={qrDataUrl}
            tracked={false}
            onCopy={copyJoinUrl}
          />
          <div className="realtime-closed">
            <div>
              <h3>학생용 QR은 이미 준비되었습니다</h3>
              <p>학생은 왼쪽 QR을 찍어 {lessonId}차시에 바로 들어갈 수 있습니다.</p>
              <p>접속 인원과 진행 상황까지 보려면 실시간 수업을 여세요. 개설되면 QR이 추적용 주소로 자동 전환됩니다.</p>
              {classCode && <p>이전 수업 코드 <strong>{classCode}</strong>를 다시 사용할 수 있습니다.</p>}
              <button disabled={busy} onClick={openClassNow}>{busy ? "연결 중…" : classCode ? "이전 코드로 수업 열기" : "실시간 수업 열기"}</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="realtime-entry-grid">
            <LessonQrCard
              lessonId={lessonId}
              url={entryUrl}
              qrDataUrl={qrDataUrl}
              classCode={classCode}
              tracked
              onCopy={copyJoinUrl}
            />

            <div className="live-summary" aria-label={`${lessonId}차시 접속 요약`}>
              <div><span>누적 참가</span><strong>{summary.total}</strong></div>
              <div><span>현재 접속</span><strong>{summary.connected}</strong></div>
              <div><span>진행 중</span><strong>{summary.active}</strong></div>
              <div><span>완료</span><strong>{summary.completed}</strong></div>
              <div><span>비AR 접속</span><strong>{summary.nonAr}</strong></div>
            </div>
          </div>

          <div className="student-progress-list" role="table" aria-label={`${lessonId}차시 익명 학생 진행 현황`}>
            <div className="student-progress-row header" role="row">
              <span>별칭</span><span>현재 위치</span><span>진행률</span><span>모드</span><span>상태</span>
            </div>
            {students.length === 0 && <p className="empty-roster">아직 {lessonId}차시에 참가한 학생이 없습니다.</p>}
            {students.map(([uid, student]) => {
              const percent = progressPercent(student);
              const online = isStudentOnline(student, now);
              return (
                <div className={`student-progress-row ${online ? "" : "offline"}`} role="row" key={uid}>
                  <b>{student.alias}<small> #{uid.slice(-4).toUpperCase()}</small></b>
                  <span>{progressLabel(student)}</span>
                  <span className="student-progress-meter"><i style={{ width: `${percent}%` }} /><em>{percent}%</em></span>
                  <span>{student.mode === "ar" ? "AR" : "비AR"}</span>
                  <strong>{online ? "접속 중" : "연결 끊김"}</strong>
                </div>
              );
            })}
          </div>
          <button className="secondary" disabled={busy} onClick={closeClassNow}>실시간 수업 종료</button>
        </>
      )}
      <p className="live-status-copy" role="status">{status}</p>
    </section>
  );
}
