import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import lesson1 from "../../public/data/content/lesson1.json";
import { MarkerRecognitionOverlay } from "../../src/ar/ArScanner";
import type { MissionScreenContent } from "../../src/content/types";
import { MissionVisualization } from "../../src/lessons/MissionVisualization";

describe("AR 인식 피드백과 도플러 시각화", () => {
  it("마커 인식 시 확인 표시와 유지 안내를 함께 보여준다", () => {
    const markup = renderToStaticMarkup(<MarkerRecognitionOverlay recognized />);
    expect(markup).toContain("마커 인식됨");
    expect(markup).toContain("마커를 화면 안에 유지하세요");
    expect(markup).toContain("ar-recognition-check");
  });

  it("탐색 중에는 인식 완료 문구를 보여주지 않는다", () => {
    const markup = renderToStaticMarkup(<MarkerRecognitionOverlay recognized={false} />);
    expect(markup).toContain("ar-tracking-frame");
    expect(markup).not.toContain("마커 인식됨");
  });

  it("도플러 조작 화면은 네 개의 원형 파면을 사용한다", () => {
    const mission = lesson1.missions[1] as unknown as MissionScreenContent;
    const markup = renderToStaticMarkup(<MissionVisualization mission={mission} value={34} />);
    expect(markup.match(/doppler-wavefront/g)).toHaveLength(4);
    expect(markup).toContain("높은 진동수");
    expect(markup).toContain("관찰자");
  });
});
