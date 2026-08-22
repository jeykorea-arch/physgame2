import { useEffect, useRef, useState } from "react";
import { isRealtimeAvailable } from "./firebaseClient";
import type { StudentRealtimeRecord } from "./types";

interface RealtimeClassPanelProps {
  lessonId: 1 | 2 | 3;
}

const PHASE_LABEL: Record<string, string> = {
  entry: "진입",
  recall: "선수학습 회상",
  game: "게임",
  explanation: "설명",
  exit: "확인",
  complete: "완료",
};

/** 교사용 실시간 수업 열기·QR 표시·학생 명단 실시간 확인. Firebase 설정이 없으면 아무것도 렌더링하지 않는다. */
export function RealtimeClassPanel({ lessonId }: RealtimeClassPanelProps) {
  const [classCode, setClassCode] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [roster, setRoster] = useState<Record<string, StudentRealtimeRecord>>({});
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
    };
  }, []);

  if (!isRealtimeAvailable()) return null;

  async function openClass() {
    setBusy(true);
    setErrorMessage(null);
    try {
      const { createClass, subscribeToClassRoster } = await import("./classSession");
      const { classCode: code } = await createClass(lessonId);
      setClassCode(code);

      const joinUrl = `${window.location.origin}${window.location.pathname}?class=${code}#/lesson/${lessonId}`;
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(joinUrl, { width: 240, margin: 1 });
      setQrDataUrl(dataUrl);

      unsubscribeRef.current?.();
      unsubscribeRef.current = await subscribeToClassRoster(code, setRoster);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function closeClassNow() {
    if (!classCode) return;
    setBusy(true);
    try {
      const { closeClass } = await import("./classSession");
      await closeClass(classCode);
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      setClassCode(null);
      setQrDataUrl(null);
      setRoster({});
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const students = Object.entries(roster);

  return (
    <div className="panel">
      <h2>실시간 수업 진행판</h2>
      {!classCode && (
        <>
          <p className="qualitative-tag">
            학생 접속·진행·점수를 이 화면에 실시간으로 띄웁니다. 실명·학번·자유서술 원문은 전송되지 않습니다.
          </p>
          <button disabled={busy} onClick={openClass}>
            실시간 수업 열기
          </button>
        </>
      )}
      {errorMessage && <p className="qualitative-tag">실시간 연결 오류: {errorMessage}</p>}
      {classCode && (
        <>
          <p>
            수업 코드: <strong style={{ fontSize: "1.5rem" }}>{classCode}</strong>
          </p>
          {qrDataUrl && <img src={qrDataUrl} alt={`수업 참가 QR, 코드 ${classCode}`} width={200} height={200} />}
          <p className="qualitative-tag">
            학생이 기본 주소로 접속했다면 위 6자리 코드를 직접 입력하게 하세요. QR을 스캔하면 자동으로 연결됩니다.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="results-table">
              <thead>
                <tr>
                  <th>별칭</th>
                  <th>상태</th>
                  <th>단계</th>
                  <th>모드</th>
                  <th>완료 문항</th>
                  <th>점수</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr>
                    <td colSpan={6}>아직 접속한 학생이 없습니다.</td>
                  </tr>
                )}
                {students.map(([uid, s]) => (
                  <tr key={uid}>
                    <td>{s.alias}</td>
                    <td>{s.connected ? "접속 중" : "끊김"}</td>
                    <td>{PHASE_LABEL[s.phase] ?? s.phase}</td>
                    <td>{s.mode === "ar" ? "AR" : "비AR"}</td>
                    <td>{s.completedQuestionCount}/4</td>
                    <td>{s.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="secondary" disabled={busy} onClick={closeClassNow}>
            수업 닫기
          </button>
        </>
      )}
    </div>
  );
}
