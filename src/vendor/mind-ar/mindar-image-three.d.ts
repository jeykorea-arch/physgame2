declare module "*/mindar-image-three.prod.js" {
  export class MindARThree {
    constructor(options: {
      container: HTMLElement;
      imageTargetSrc: string;
      maxTrack?: number;
      uiLoading?: "yes" | "no";
      uiScanning?: "yes" | "no";
      uiError?: "yes" | "no";
      filterMinCF?: number | null;
      filterBeta?: number | null;
    });
    renderer: { setAnimationLoop: (cb: (() => void) | null) => void; render: (scene: unknown, camera: unknown) => void };
    scene: unknown;
    camera: unknown;
    start: () => Promise<void>;
    stop: () => void;
    addAnchor: (targetIndex: number) => {
      group: import("three").Group;
      onTargetFound: (() => void) | null;
      onTargetLost: (() => void) | null;
    };
  }
}
