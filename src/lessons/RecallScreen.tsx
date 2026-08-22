import { useState } from "react";
import type { ChoiceId, LessonContent } from "../content/types";

interface RecallScreenProps {
  lessonContent: LessonContent;
  onDone: () => void;
}

/** 선수학습 회상 5분. 계산하지 않고 점수화하지 않는 진단이다(docs/02). */
export function RecallScreen({ lessonContent, onDone }: RecallScreenProps) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<ChoiceId | null>(null);
  const prompts = lessonContent.recallPrompts;
  const current = prompts[index];

  function next() {
    setChoice(null);
    if (index + 1 < prompts.length) setIndex((i) => i + 1);
    else onDone();
  }

  return (
    <div className="screen">
      <div className="panel">
        <span className="badge">선수학습 회상</span>
        <p>{current.prompt}</p>
        <div className="choice-list">
          {current.choices.map((c) => (
            <button
              key={c.id}
              className="choice-button"
              data-state={choice === c.id ? (c.id === current.correctChoiceId ? "correct" : "incorrect") : undefined}
              onClick={() => setChoice(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button disabled={!choice} onClick={next}>
          {index + 1 < prompts.length ? "다음" : "게임 시작하기"}
        </button>
      </div>
    </div>
  );
}
