import type { LessonContent } from "../content/types";

interface ExplanationScreenProps {
  lessonContent: LessonContent;
  onDone: () => void;
}

/** 교사 설명 13분. 게임에서 드러난 오개념과 1:1로 연결된 카드를 보여준다(docs/02 콘텐츠 완료 조건). */
export function ExplanationScreen({ lessonContent, onDone }: ExplanationScreenProps) {
  return (
    <div className="screen">
      <div className="panel">
        <span className="badge">교사의 정확한 설명 (13분)</span>
        <p>게임이 저장되었습니다. 아래 카드를 순서대로 설명하세요.</p>
      </div>
      {lessonContent.teacherExplanationCards.map((card, i) => (
        <div className="panel" key={i}>
          <h3>{card.title}</h3>
          <p>{card.body}</p>
        </div>
      ))}
      <button onClick={onDone}>확인 문항으로 이동</button>
    </div>
  );
}
