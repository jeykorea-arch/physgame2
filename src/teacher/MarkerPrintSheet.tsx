const MARKERS: { file: string; label: string; lessonId: 1 | 2 | 3 }[] = [
  { file: "M01_파동의_흔적.png", label: "M01 파동의 흔적 (1차시)", lessonId: 1 },
  { file: "M02_전자기파의_선택.png", label: "M02 전자기파의 선택 (2차시)", lessonId: 2 },
  { file: "M03_양자의_증거.png", label: "M03 양자의 증거 (3차시)", lessonId: 3 },
];

/**
 * AR은 화면 속 그림이 아니라 종이에 인쇄된 마커를 카메라로 비춰야 작동한다(docs/03 9절, assets/markers/README.md).
 * 이 화면은 교사가 수업 전 마커 3종을 인쇄하도록 돕는다. 인쇄 버튼은 이 패널만 인쇄되게 한다.
 */
export function MarkerPrintSheet() {
  return (
    <div className="panel">
      <h2>마커 인쇄 준비</h2>
      <p className="qualitative-tag">
        AR은 이 화면 속 그림을 비추는 것이 아니라, <strong>인쇄된 마커 종이</strong>를 카메라로 비춰야 작동한다.
        아래 3종을 8×8cm 무광 인쇄해 학생 책상에 준비하세요.
      </p>
      <button onClick={() => window.print()}>마커 3종 인쇄하기</button>

      <div className="marker-print-sheet">
        {MARKERS.map((m) => (
          <div key={m.file} className="marker-print-item">
            <img src={`${import.meta.env.BASE_URL}assets/markers/${m.file}`} alt={m.label} width={300} height={300} />
            <p>{m.label}</p>
          </div>
        ))}
      </div>

      <p className="qualitative-tag">
        인쇄·시험 조건: 8×8cm 무광 인쇄, 30~50cm 거리, 밝은 조명. targetIndex는 M01=0, M02=1, M03=2로
        고정되어 있으므로 파일명·순서를 바꾸지 않는다.
      </p>
    </div>
  );
}
