import { useState } from "react";

interface NonArCardProps {
  arObservationText: string;
  onObserved: () => void;
}

/** AR 실패·미허용 학생을 위한 동등한 비AR 경로(AGENTS.md 5). 점수·콘텐츠 불이익이 없다. */
export function NonArCard({ arObservationText, onObserved }: NonArCardProps) {
  const [opened, setOpened] = useState(false);
  return (
    <div className="panel">
      {!opened ? (
        <button onClick={() => setOpened(true)}>증거 카드 열기</button>
      ) : (
        <>
          <p>{arObservationText}</p>
          <p className="qualitative-tag">30~60초 정도 읽고 상상해본 뒤 다음으로 진행하세요.</p>
          <button onClick={onObserved}>관찰 완료, 다음으로</button>
        </>
      )}
    </div>
  );
}
