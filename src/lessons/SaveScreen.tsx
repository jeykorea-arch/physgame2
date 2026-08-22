import { downloadAnonymousExport } from "../storage/export";

interface SaveScreenProps {
  lessonId: 1 | 2 | 3;
  onGoHome: () => void;
}

export function SaveScreen({ lessonId, onGoHome }: SaveScreenProps) {
  return (
    <div className="screen">
      <div className="panel">
        <span className="badge">저장 완료</span>
        <h2>{lessonId}차시 진행이 저장되었습니다.</h2>
        <p>진행 손실 없이 종료할 수 있습니다. 필요하면 아래에서 익명 결과를 내보낼 수 있습니다.</p>
        <button className="secondary" onClick={downloadAnonymousExport}>
          익명 결과 JSON 내보내기
        </button>
        <button onClick={onGoHome}>차시 선택으로 돌아가기</button>
      </div>
    </div>
  );
}
