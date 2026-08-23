export function ObservationVisual({ targetIndex }: { targetIndex: number }) {
  if (targetIndex === 0) {
    return (
      <figure className="observation-visual">
        <svg viewBox="0 0 320 332" role="img" aria-label="슬릿 뒤 회절과 오른쪽 관찰자에게 다가가는 음원이 만든 원형 파면 비교">
          <title>파동의 흔적 관찰</title>
          <rect x="150" y="10" width="8" height="60" rx="3" />
          <rect x="150" y="100" width="8" height="60" rx="3" />
          {[30, 55, 80].map((r) => <circle key={r} cx="82" cy="85" r={r} className="wave-line" />)}
          {[35, 62, 90].map((r) => <path key={r} d={`M158 ${85 - r} A${r} ${r} 0 0 1 158 ${85 + r}`} className="wave-line" />)}
          <circle cx="82" cy="85" r="7" className="source-dot" />
          <text x="18" y="160">입사 파면</text><text x="205" y="160">좁은 틈 뒤 회절</text>
          {[1, 2, 3, 4].map((i) => <circle key={`doppler-${i}`} cx={155 - i * 7} cy="218" r={i * 18} className="wave-line" />)}
          <circle cx="155" cy="218" r="7" className="source-dot" />
          <circle cx="286" cy="218" r="8" className="visual-target" />
          <text x="166" y="192" className="doppler-motion-label">이동 →</text>
          <text x="12" y="326" className="doppler-label">뒤쪽: 긴 파장</text>
          <text x="170" y="316" className="doppler-label">앞쪽: 짧은 파장</text><text x="170" y="330" className="doppler-label">→ 높은 진동수</text>
        </svg>
        <figcaption>정성 모형: 슬릿 폭이 좁아질수록 회절각이 커진다. 도플러 활동에서는 음원 앞쪽 파면 간격이 더 좁다.</figcaption>
      </figure>
    );
  }
  if (targetIndex === 1) {
    return (
      <figure className="observation-visual">
        <svg viewBox="0 0 320 180" role="img" aria-label="레이더 왕복 신호, 야기 안테나 주엽, 유한 폭 LC 공명 곡선">
          <title>전자기파의 선택 관찰</title>
          <rect x="18" y="28" width="34" height="30" rx="4" /><polygon points="260,20 286,43 260,66" />
          <path d="M55 34 H246" className="signal-out" /><path d="M246 54 H55" className="signal-back" />
          <text x="92" y="22">왕복 시간 → 거리</text>
          <path d="M45 115 Q105 70 165 115 Q105 160 45 115" className="lobe" /><line x1="30" y1="115" x2="105" y2="115" />
          <path d="M185 155 Q220 75 255 155" className="resonance" /><line x1="175" y1="155" x2="295" y2="155" />
          <text x="22" y="174">야기 주엽</text><text x="190" y="174">유한 대역폭</text>
        </svg>
        <figcaption>거리 정보는 왕복 시간, 방사 속도는 부호 있는 도플러 편이로 구분한다. 방향 이득과 LC 공명은 서로 다른 선택 기능이다.</figcaption>
      </figure>
    );
  }
  return (
    <figure className="observation-visual">
      <svg viewBox="0 0 320 180" role="img" aria-label="광자가 금속에 닿아 전자가 방출되고 점 검출이 확률 분포로 누적되는 장면">
        <title>양자의 증거 관찰</title>
        <circle cx="34" cy="45" r="8" className="photon-dot" /><path d="M45 45 H112" className="signal-out" />
        <rect x="120" y="18" width="10" height="70" rx="3" /><path d="M132 45 Q164 12 190 35" className="electron-path" />
        <circle cx="190" cy="35" r="6" className="electron-dot" /><text x="12" y="105">hf ≥ φ → Kmax ≥ 0</text>
        {Array.from({ length: 26 }, (_, i) => {
          const x = 205 + ((i * 47) % 96);
          const y = 82 + Math.sin(i * 1.7) * (12 + (i % 4) * 5);
          return <circle key={i} cx={x} cy={y} r="2.5" className="probability-dot" />;
        })}
        <path d="M190 150 Q240 105 305 150" className="probability-curve" />
        <text x="190" y="174">국소 검출의 누적 분포</text>
      </svg>
      <figcaption>각 전자는 한 점으로 검출된다. 많은 검출의 분포와 |ψ|² 확률 밀도는 실제 안개나 고전 궤도가 아니다.</figcaption>
    </figure>
  );
}
