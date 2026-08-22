import { useCallback, useEffect, useRef, useState } from "react";
import type { TechEventCode } from "../storage/models";

export type ArState =
  | "idle"
  | "webgl-unsupported"
  | "requesting-permission"
  | "camera-denied"
  | "camera-start-failed"
  | "loading"
  | "searching"
  | "slow-search"
  | "fallback-suggested"
  | "found"
  | "stopped";

const SLOW_SEARCH_MS = 10_000;
const FALLBACK_SUGGEST_MS = 20_000;

export function checkWebglSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

interface UseArControllerOptions {
  targetIndex: number;
  targetsMindUrl: string;
  onTechEvent: (code: TechEventCode) => void;
}

interface MindArAnchor {
  group: import("three").Group;
  onTargetFound: (() => void) | null;
  onTargetLost: (() => void) | null;
}

interface MindArThreeInstance {
  renderer: { setAnimationLoop: (cb: (() => void) | null) => void; render: (scene: unknown, camera: unknown) => void };
  scene: unknown;
  camera: unknown;
  start: () => Promise<void>;
  stop: () => void;
  addAnchor: (targetIndex: number) => MindArAnchor;
}

/** 카메라·AR 상태 전이(docs/03 5절)를 관리한다. 카메라는 start()가 명시적으로 호출된 뒤에만 요청한다(AGENTS.md 7). */
export function useArController({ targetIndex, targetsMindUrl, onTechEvent }: UseArControllerOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mindArRef = useRef<MindArThreeInstance | null>(null);
  const lessonSceneRef = useRef<import("./ar-scenes").LessonArScene | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<ArState>("idle");

  const clearTimers = useCallback(() => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    slowTimerRef.current = null;
    fallbackTimerRef.current = null;
  }, []);

  const startSearchTimers = useCallback(() => {
    clearTimers();
    slowTimerRef.current = setTimeout(() => {
      onTechEvent("markerNotFound10s");
      setState("slow-search");
    }, SLOW_SEARCH_MS);
    fallbackTimerRef.current = setTimeout(() => {
      onTechEvent("markerNotFound20s");
      setState("fallback-suggested");
    }, FALLBACK_SUGGEST_MS);
  }, [clearTimers, onTechEvent]);

  const stop = useCallback(() => {
    clearTimers();
    try {
      mindArRef.current?.renderer.setAnimationLoop(null);
      mindArRef.current?.stop();
    } catch {
      // 카메라가 이미 정지된 경우 등은 무시한다.
    }
    lessonSceneRef.current?.dispose();
    lessonSceneRef.current = null;
    mindArRef.current = null;
    setState("stopped");
  }, [clearTimers]);

  const start = useCallback(async () => {
    if (!containerRef.current) return;
    if (!checkWebglSupport()) {
      onTechEvent("webglFailed");
      setState("webgl-unsupported");
      return;
    }

    setState("requesting-permission");
    try {
      const [{ MindARThree }, { createLessonArScene }] = await Promise.all([
        import("../vendor/mind-ar/mindar-image-three.prod.js"),
        import("./ar-scenes"),
      ]);
      const mindarThree = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: targetsMindUrl,
        maxTrack: 1,
        uiLoading: "no",
        uiScanning: "no",
        uiError: "no",
      }) as unknown as MindArThreeInstance;
      mindArRef.current = mindarThree;

      const anchor = mindarThree.addAnchor(targetIndex);
      const lessonScene = createLessonArScene(targetIndex);
      lessonSceneRef.current = lessonScene;
      anchor.group.add(lessonScene.group);
      anchor.onTargetFound = () => {
        clearTimers();
        setState("found");
      };
      anchor.onTargetLost = () => {
        // 마커 유실 시 AR 관찰만 일시 정지하고, 이미 진행 중인 2D 조작 상태는 초기화하지 않는다.
        setState("searching");
        startSearchTimers();
      };

      setState("loading");
      await mindarThree.start();
      const animationStartedAt = performance.now();
      mindarThree.renderer.setAnimationLoop(() => {
        lessonScene.update((performance.now() - animationStartedAt) / 1000);
        mindarThree.renderer.render(mindarThree.scene, mindarThree.camera);
      });

      setState("searching");
      startSearchTimers();
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        onTechEvent("cameraDenied");
        setState("camera-denied");
      } else {
        onTechEvent("cameraStartFailed");
        setState("camera-start-failed");
      }
    }
  }, [targetIndex, targetsMindUrl, onTechEvent, clearTimers, startSearchTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
      try {
        mindArRef.current?.renderer.setAnimationLoop(null);
        mindArRef.current?.stop();
      } catch {
        // 언마운트 시 정리 실패는 무시한다.
      }
      lessonSceneRef.current?.dispose();
      lessonSceneRef.current = null;
    };
  }, [clearTimers]);

  return { containerRef, state, start, stop };
}
