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
});
