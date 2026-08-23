import type { MissionScreenContent } from "../content/types";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function MissionVisualization({ mission, value }: { mission: MissionScreenContent; value: number }) {
  if (mission.id === "L1-M1") {
    const spread = 24 + (1 - clamp01((value - mission.controlMin) / (mission.controlMax - mission.controlMin))) * 62;
    return (
      <svg className="mission-visual" viewBox="0 0 300 130" role="img" aria-label={`슬릿 폭 ${value} 마이크로미터에서 중앙 회절 무늬 폭 비교`}>
        <rect x="20" y="12" width="6" height="45" /><rect x="20" y="75" width="6" height="43" />
        <path d={`M28 65 Q100 ${65 - spread} 178 65 Q100 ${65 + spread} 28 65`} className="visual-wave" />
        <rect x="205" y={65 - spread / 2} width="45" height={spread} rx="8" className="bright-fringe" />
        <line x1="205" y1={65 - spread / 2} x2="270" y2={65 - spread / 2} className="visual-guide" />
        <line x1="205" y1={65 + spread / 2} x2="270" y2={65 + spread / 2} className="visual-guide" />
        <text x="190" y="124">첫 최소 사이 중앙 무늬</text>
      </svg>
    );
  }

  if (mission.id === "L1-M2") {
    const sourceX = 155;
    const sourceY = 58;
    const sourceAdvance = clamp01(value / 100) * 10;
    const waveRadiusStep = 18;
    return (
      <svg className="mission-visual" viewBox="0 0 300 178" role="img" aria-label={`오른쪽 관찰자에게 초속 ${value}미터로 다가가는 음원의 원형 파면. 앞쪽 간격은 좁고 뒤쪽 간격은 넓다`}>
        <title>움직이는 음원이 만든 원형 파면</title>
        {[1, 2, 3, 4].map((i) => (
          <circle
            key={`wavefront-${i}`}
            cx={sourceX - i * sourceAdvance}
            cy={sourceY}
            r={i * waveRadiusStep}
            className="doppler-wavefront"
          />
        ))}
        <circle cx={sourceX} cy={sourceY} r="11" className="visual-source" />
        <circle cx="270" cy={sourceY} r="10" className="visual-target" />
        <path d="M185 30 H222 M213 23 L222 30 L213 37" className="visual-arrow" />
        <text x="129" y="19">움직이는 음원</text>
        <text x="247" y="83">관찰자</text>
        <text x="28" y="170">뒤쪽 파장 큼</text>
        <text x="177" y="162">앞쪽 파장 작음</text>
        <text x="177" y="175">→ 높은 진동수</text>
      </svg>
    );
  }

  if (mission.id === "L2-M1") {
    const frequencyHz = value * 1e6;
    const xl = 2 * Math.PI * frequencyHz * 10e-6;
    const xc = 1 / (2 * Math.PI * frequencyHz * 200e-12);
    const scale = Math.max(xl, xc, 1);
    const xlHeight = 72 * (xl / scale);
    const xcHeight = 72 * (xc / scale);
    return (
      <svg className="mission-visual" viewBox="0 0 300 135" role="img" aria-label={`주파수 ${value}메가헤르츠에서 유도 리액턴스와 용량 리액턴스 비교`}>
        <line x1="38" y1="102" x2="262" y2="102" className="visual-guide" />
        <rect x="70" y={102 - xlHeight} width="54" height={xlHeight} rx="6" className="bright-fringe" />
        <rect x="176" y={102 - xcHeight} width="54" height={xcHeight} rx="6" className="visual-target" />
        <text x="79" y="124">X_L</text><text x="185" y="124">X_C</text>
        <text x="66" y="16">공진 조건: X_L = X_C</text>
      </svg>
    );
  }

  if (mission.id === "L2-M2") {
    const f0 = 1 / (2 * Math.PI * Math.sqrt(value * 1e-6 * 200e-12)) / 1e6;
    const markerX = 36 + clamp01((f0 - 2.5) / 5) * 228;
    return (
      <svg className="mission-visual" viewBox="0 0 300 125" role="img" aria-label={`인덕턴스 ${value}마이크로헨리에서 공진 주파수 ${f0.toFixed(3)}메가헤르츠`}>
        <path d="M30 40 h18 c10 0 10 20 20 20 s10 -20 20 -20 s10 20 20 20 s10 -20 20 -20 h18" className="visual-wave" />
        <line x1="146" y1="40" x2="146" y2="72" className="visual-guide" />
        <line x1="166" y1="40" x2="166" y2="72" className="visual-guide" />
        <line x1="166" y1="56" x2="270" y2="56" className="visual-guide" />
        <text x="54" y="26">L 조절</text><text x="138" y="88">C 고정</text>
        <line x1="36" y1="105" x2="264" y2="105" className="visual-guide" />
        <circle cx={markerX} cy="105" r="7" className="source-dot" />
        <text x="34" y="120">2.5</text><text x="239" y="120">7.5 MHz</text>
      </svg>
    );
  }

  if (mission.id === "L3-M1") {
    const threshold = 4.83598;
    const x = 25 + clamp01((value - 4) / 5) * 250;
    const thresholdX = 25 + ((threshold - 4) / 5) * 250;
    const emitted = value >= threshold;
    return (
      <svg className="mission-visual" viewBox="0 0 300 115" role="img" aria-label={`빛 진동수 ${value} 곱하기 10의 14승 헤르츠, 광전자 ${emitted ? "방출" : "방출 없음"}`}>
        <line x1="25" y1="65" x2="275" y2="65" className="visual-guide" />
        <line x1={thresholdX} y1="25" x2={thresholdX} y2="85" className="threshold-line" />
        <circle cx={x} cy="65" r="9" className={emitted ? "electron-dot" : "photon-dot"} />
        <text x={thresholdX + 4} y="22">문턱 4.836</text><text x="25" y="104">{emitted ? "Kmax ≥ 0, 방출" : "hf < φ, 방출 없음"}</text>
      </svg>
    );
  }

  if (mission.id === "L3-M1b") {
    const dots = Math.round(value * 2);
    return (
      <svg className="mission-visual" viewBox="0 0 300 115" role="img" aria-label={`상대 빛 세기 ${value}, 광전류에 대응하는 검출 전자 수 증가`}>
        <line x1="28" y1="26" x2="28" y2="92" className="visual-guide" />
        {Array.from({ length: dots }, (_, i) => <circle key={i} cx={55 + (i % 10) * 22} cy={35 + Math.floor(i / 10) * 35} r="6" className="electron-dot" />)}
        <text x="28" y="110">진동수 고정: 전자 수는 증가, Kmax는 일정</text>
      </svg>
    );
  }

  if (mission.id === "L3-M3") {
    const xWidth = 18 + clamp01((value - mission.controlMin) / (mission.controlMax - mission.controlMin)) * 80;
    const pWidth = 108 - xWidth;
    return (
      <svg className="mission-visual" viewBox="0 0 300 125" role="img" aria-label={`위치 분포 폭 ${value}옹스트롬과 반비례하는 최소 운동량 분포 폭`}>
        <path d={`M20 52 Q75 ${52 - xWidth / 2} 130 52 Q75 ${52 + xWidth / 2} 20 52`} className="probability-curve" />
        <path d={`M170 52 Q225 ${52 - pWidth / 2} 280 52 Q225 ${52 + pWidth / 2} 170 52`} className="visual-wave" />
        <text x="45" y="112">위치 분포 Δx</text><text x="190" y="112">운동량 분포 Δp</text>
      </svg>
    );
  }

  return null;
}
