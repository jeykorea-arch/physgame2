import { useState } from "react";
import { ObservationVisual } from "./ObservationVisual";

interface NonArCardProps {
  arObservationText: string;
  targetIndex: number;
  onObserved: () => void;
}

/** AR 실패·미허용 학생을 위한 동등한 비AR 경로(AGENTS.md 5). 점수·콘텐츠 불이익이 없다. */
export function NonArCard({ arObservationText, targetIndex, onObserved }: NonArCardProps) {
  const [opened, setOpened] = useState(false);
  return (
    <div className="panel">
      {!opened ? (
        <button onClick={() => setOpened(true)}>증거 카드 열기</button>
      ) : (
        <>
          <p>{arObservationText}</p>
          <ObservationVisual targetIndex={targetIndex} />
          <p className="qualitative-tag">AR과 같은 핵심 현상을 나타낸 과학 시각 자료입니다. 30~60초 관찰한 뒤 다음으로 진행하세요.</p>
          <button onClick={onObserved}>관찰 완료, 다음으로</button>
        </>
      )}
    </div>
  );
}
