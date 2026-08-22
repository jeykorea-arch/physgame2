import { useMemo } from "react";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 정성적 간섭 무늬 밀도(실제 회절 변수와 무관한 예시 함수). 누적 시각화 전용이다. */
function qualitativeFringeIntensity(x: number): number {
  const interference = Math.cos(6 * x) ** 2;
  const envelope = x === 0 ? 1 : (Math.sin(2 * x) / (2 * x)) ** 2;
  return interference * envelope;
}

function samplePoints(count: number, seed: number): { x: number; y: number }[] {
  const rand = mulberry32(seed);
  const points: { x: number; y: number }[] = [];
  let guard = 0;
  while (points.length < count && guard < count * 200) {
    guard++;
    const x = (rand() * 2 - 1) * 2; // -2..2
    const p = qualitativeFringeIntensity(x);
    if (rand() < p) {
      const y = rand() * 2 - 1;
      points.push({ x, y });
    }
  }
  return points;
}

export function AccumulationVisualization({ count }: { count: number }) {
  const points = useMemo(() => samplePoints(Math.min(count, 2000), 1234), [count]);
  return (
    <div>
      <svg viewBox="-2 -1 4 2" width="100%" height="140" role="img" aria-label={`누적 검출 ${count}개의 정성적 시각화`}>
        <rect x={-2} y={-1} width={4} height={2} fill="rgba(255,255,255,0.04)" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={0.012} fill="#6fd3ff" />
        ))}
      </svg>
      <p className="qualitative-tag">정성적 시각화: 실제 슬릿 변수와 무관한 예시 무늬다. 각 점은 국소적 검출 하나를 나타낸다.</p>
    </div>
  );
}
