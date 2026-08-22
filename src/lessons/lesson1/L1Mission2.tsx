import { useState } from "react";
import type { MissionScreenContent } from "../../content/types";
import { MissionCard } from "../MissionCard";
import { computeL1M2 } from "./calculations";

export function L1Mission2({ mission, onComplete }: { mission: MissionScreenContent; onComplete: () => void }) {
  const [direction, setDirection] = useState<"approaching" | "receding">("approaching");

  return (
    <MissionCard
      mission={mission}
      onComplete={onComplete}
      computeReadout={(v) => computeL1M2(v, direction)}
      extraControls={
        <div className="choice-list" role="radiogroup" aria-label="음원 방향">
          <button className="choice-button" data-state={direction === "approaching" ? "correct" : undefined} onClick={() => setDirection("approaching")}>
            음원이 접근한다
          </button>
          <button className="choice-button" data-state={direction === "receding" ? "correct" : undefined} onClick={() => setDirection("receding")}>
            음원이 멀어진다
          </button>
        </div>
      }
    />
  );
}
