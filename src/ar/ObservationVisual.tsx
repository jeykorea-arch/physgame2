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
        <svg viewBox="0 0 320 206" role="img" aria-label="레이더와 안테나가 받은 전자기파 신호를 RLC 수신 회로가 공진 주파수로 선택하는 이야기 장면">
          <title>전자기파의 선택 관찰</title>
          <rect x="14" y="24" width="34" height="28" rx="4" /><text x="9" y="68">레이더</text>
          <line x1="80" y1="18" x2="80" y2="58" /><line x1="68" y1="28" x2="92" y2="28" /><line x1="64" y1="40" x2="96" y2="40" />
          <text x="58" y="68">안테나</text>
          {[0, 1, 2].map((i) => <path key={i} d={`M102 ${27 + i * 10} Q132 ${17 + i * 10} 158 ${27 + i * 10}`} className="wave-line" />)}
          <rect x="166" y="14" width="138" height="68" rx="8" className="visual-guide" />
          <text x="183" y="34">RLC 수신 회로</text><text x="181" y="56">f₀ = 1/(2π√LC)</text>
          <path d="M178 148 Q220 82 262 148" className="resonance" /><line x1="154" y1="148" x2="300" y2="148" />
          <line x1="220" y1="88" x2="220" y2="156" className="threshold-line" />
          <text x="204" y="174">f₀</text><text x="128" y="198">원하는 신호에서 응답이 가장 큼</text>
        </svg>
        <figcaption>레이더와 안테나는 전자기파를 보내고 받는 사용 사례다. 학생 활동은 RLC 회로의 L과 C가 공진 주파수를 정하고 원하는 신호를 선택하는 원리에 집중한다.</figcaption>
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
