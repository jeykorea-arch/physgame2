import { useState } from "react";
import type { ChoiceId, QuestionContent } from "../content/types";
import { scoreForAttempt, type AnswerRecord } from "../storage/models";

interface QuizQuestionProps {
  question: QuestionContent;
  onComplete: (answer: AnswerRecord) => void;
}

/**
 * 공통 피드백 문체(docs/02): "틀렸습니다"가 아니라 어떤 변수·현상을 잘못 연결했는지 알려준다.
 * 두 번 오답 후에는 원리를 안내하고 완료 가능하게 한다(docs/01 8절).
 * 정답·오답 피드백은 학생이 "다음 문항" 버튼을 눌러 확인한 뒤에만 다음으로 넘어간다(docs/01 6.2절 7단계).
 */
export function QuizQuestion({ question, onComplete }: QuizQuestionProps) {
  const [attempt, setAttempt] = useState(0);
  const [lastChoice, setLastChoice] = useState<ChoiceId | null>(null);
  const [resolved, setResolved] = useState<{ correct: boolean; byHint: boolean; attempt: number } | null>(null);
  const [startedAt] = useState(() => Date.now());

  function handleChoice(choiceId: ChoiceId) {
    if (resolved) return;
    const nextAttempt = attempt + 1;
    setAttempt(nextAttempt);
    setLastChoice(choiceId);

    if (choiceId === question.correctChoiceId) {
      setResolved({ correct: true, byHint: false, attempt: nextAttempt });
      return;
    }

    if (nextAttempt >= 2) {
      setResolved({ correct: false, byHint: true, attempt: nextAttempt });
      return;
    }
    // 첫 오답: 재시도를 허용한다(피드백만 표시, 아직 완료 처리 안 함).
  }

  function handleNext() {
    if (!resolved || !lastChoice) return;
    const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
    const score = scoreForAttempt(resolved.attempt, resolved.byHint);
    onComplete({
      questionId: question.id,
      responseCode: lastChoice,
      correct: resolved.correct,
      attempt: resolved.attempt,
      score,
      elapsedSeconds,
    });
  }

  return (
    <div className="panel" role="group" aria-label={question.prompt}>
      <p>{question.prompt}</p>
      <div className="choice-list">
        {question.choices.map((choice) => {
          let state: "default" | "correct" | "incorrect" = "default";
          if (resolved && choice.id === question.correctChoiceId) state = "correct";
          else if (lastChoice === choice.id && choice.id !== question.correctChoiceId) state = "incorrect";
          return (
            <button
              key={choice.id}
              className="choice-button"
              data-state={state === "default" ? undefined : state}
              disabled={!!resolved}
              onClick={() => handleChoice(choice.id)}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      {lastChoice && !resolved && lastChoice !== question.correctChoiceId && (
        <div className="feedback-box">{question.incorrectFeedback[lastChoice]}</div>
      )}
      {resolved && (
        <>
          <div className="feedback-box">
            {resolved.byHint ? (
              <>
                <strong>원리 안내: </strong>
                {question.correctFeedback}
              </>
            ) : (
              question.correctFeedback
            )}
          </div>
          <button onClick={handleNext}>다음 문항</button>
        </>
      )}
    </div>
  );
}
