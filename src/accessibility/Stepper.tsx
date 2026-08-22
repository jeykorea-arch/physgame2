interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

/** 드래그 슬라이더의 접근성 대체 조작. 슬라이더와 +/- 버튼을 함께 제공한다(AGENTS.md 8). */
export function Stepper({ label, value, min, max, step, unit, onChange }: StepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  return (
    <label className="control-row">
      <span>
        {label}: <strong>{Number(value.toFixed(3))}</strong> {unit}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-label={label}
      />
      <div className="stepper">
        <button type="button" className="secondary" aria-label={`${label} 감소`} onClick={() => onChange(clamp(value - step))}>
          −
        </button>
        <button type="button" className="secondary" aria-label={`${label} 증가`} onClick={() => onChange(clamp(value + step))}>
          +
        </button>
      </div>
    </label>
  );
}
