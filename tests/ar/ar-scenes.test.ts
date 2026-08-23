import { describe, expect, it } from "vitest";
import { createLessonArScene } from "../../src/ar/ar-scenes";

describe("차시별 AR 장면", () => {
  for (const targetIndex of [0, 1, 2]) {
    it(`targetIndex ${targetIndex}에 실제 Three.js 물체와 애니메이션이 있다`, () => {
      const scene = createLessonArScene(targetIndex);
      expect(scene.group.children.length).toBeGreaterThan(2);
      expect(() => scene.update(1.25)).not.toThrow();
      expect(() => scene.dispose()).not.toThrow();
    });
  }

  it("1차시 AR 도플러 장면은 진행 방향으로 압축된 원형 파면을 사용한다", () => {
    const scene = createLessonArScene(0);
    const wavefronts = scene.group.children.filter((child) => child.name.startsWith("doppler-wavefront-"));
    expect(wavefronts).toHaveLength(4);
    expect(scene.group.getObjectByName("doppler-observer")).toBeDefined();
    scene.dispose();
  });
});
