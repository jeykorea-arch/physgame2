import { useState } from "react";
import type { ChoiceId, LessonContent } from "../content/types";
import { saveExitCheckChoice } from "../storage/progress";

interface ExitCheckScreenProps {
  lessonId: 1 | 2 | 3;
  lessonContent: LessonContent;
  onDone: () => void;
}

/** 출구 확인은 게임 점수와 분리 저장한다(docs/01 8절). */
export function ExitCheckScreen({ lessonId, lessonContent, onDone }: ExitCheckScreenProps) {
  const [choice, setChoice] = useState<ChoiceId | null>(null);
  const q = lessonContent.exitCheckQuestion;

  function submit() {
    if (!choice) return;
    saveExitCheckChoice(lessonId, choice === q.correctChoiceId);
    onDone();
  }

  return (
    <div className="screen">
      <div className="panel">
        <span className="badge">확인 (3분)</span>
        <p>{lessonContent.exitCheckPrompt}</p>
        <p className="qualitative-tag">아래는 자동 채점을 위한 선택형 확인 문항입니다. 자유 서술은 종이·구두로 함께 확인하세요.</p>
        <div className="choice-list">
          {q.choices.map((c) => (
            <button key={c.id} className="choice-button" data-state={choice === c.id ? "selected" : undefined} onClick={() => setChoice(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <button disabled={!choice} onClick={submit}>
          제출하고 저장하기
        </button>
      </div>
    </div>
  );
}
