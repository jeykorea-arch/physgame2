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
    const compression = 10 + (value / 100) * 13;
    return (
      <svg className="mission-visual" viewBox="0 0 300 120" role="img" aria-label={`음원 속력 ${value}미터 매초에서 앞뒤 파면 간격 비교`}>
        <circle cx="145" cy="55" r="12" className="visual-source" />
        {[1, 2, 3, 4].map((i) => <line key={`front-${i}`} x1={155 + i * (25 - compression / 2)} y1="22" x2={155 + i * (25 - compression / 2)} y2="88" className="visual-wave" />)}
        {[1, 2, 3].map((i) => <line key={`back-${i}`} x1={133 - i * (25 + compression / 2)} y1="22" x2={133 - i * (25 + compression / 2)} y2="88" className="visual-wave" />)}
        <path d="M132 102 H160" className="visual-arrow" /><text x="90" y="116">뒤쪽 파장 큼</text><text x="178" y="116">앞쪽 파장 작음</text>
      </svg>
    );
  }

  if (mission.id === "L2-M1") {
    const targetX = 80 + clamp01((value - mission.controlMin) / (mission.controlMax - mission.controlMin)) * 190;
    return (
      <svg className="mission-visual" viewBox="0 0 300 110" role="img" aria-label={`왕복 시간 ${value}마이크로초에 대응하는 목표 거리`}>
        <rect x="18" y="38" width="32" height="28" rx="4" /><polygon points={`${targetX},30 ${targetX + 24},52 ${targetX},74`} />
        <path d={`M52 43 H${targetX - 5}`} className="signal-out" /><path d={`M${targetX - 5} 63 H52`} className="signal-back" />
        <text x="16" y="100">레이더</text><text x={Math.max(190, targetX - 8)} y="100">목표</text>
      </svg>
    );
  }

  if (mission.id === "L2-M2") {
    const magnitude = Math.max(18, Math.abs(value) * 1.6);
    const start = value >= 0 ? 245 : 55;
    const end = value >= 0 ? 245 - magnitude : 55 + magnitude;
    return (
      <svg className="mission-visual" viewBox="0 0 300 105" role="img" aria-label={`방사 속도 ${value}미터 매초, ${value > 0 ? "접근" : value < 0 ? "후퇴" : "정지"}`}>
        <rect x="18" y="35" width="35" height="32" rx="4" /><circle cx="245" cy="51" r="14" className="visual-target" />
        <line x1="55" y1="51" x2="228" y2="51" className="visual-guide" />
        {value !== 0 && <path d={`M${start} 82 H${end}`} className="visual-arrow" />}
        <text x="13" y="96">레이더</text><text x="215" y="96">{value > 0 ? "접근(+)" : value < 0 ? "후퇴(−)" : "방사 성분 0"}</text>
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
