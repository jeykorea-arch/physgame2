import { useEffect } from "react";
import { useArController } from "./ar-controller";
import type { TechEventCode } from "../storage/models";
import { ObservationVisual } from "./ObservationVisual";

interface ArScannerProps {
  targetIndex: number;
  targetsMindUrl: string;
  arObservationText: string;
  onTechEvent: (code: TechEventCode) => void;
  onFallback: () => void;
  onObserved: () => void;
}

export function ArScanner({ targetIndex, targetsMindUrl, arObservationText, onTechEvent, onFallback, onObserved }: ArScannerProps) {
  const { containerRef, state, start, stop } = useArController({ targetIndex, targetsMindUrl, onTechEvent });

  useEffect(() => stop, [stop]);

  return (
    <div className="panel">
      <p className="qualitative-tag">
        카메라는 기기 내 인식에만 사용되며 저장·전송되지 않습니다. 자리에 앉은 채로 마커를 촬영하세요. 카메라를 보며 이동하지 마세요.
      </p>

      {/*
        "stopped"도 시작 버튼을 다시 보여준다. React 18 StrictMode(개발 모드)는 마운트 직후
        효과를 마운트→클린업→재마운트 순으로 한 번 더 실행하는데, 이때 stop()이 호출되어
        state가 "stopped"가 될 수 있다. 이 상태를 별도로 처리하지 않으면 화면이 빈 채로 멈춘다.
      */}
      {(state === "idle" || state === "stopped") && <button onClick={start}>AR 시작(카메라 켜기)</button>}

      {(state === "requesting-permission" || state === "loading") && <p>카메라를 준비하는 중...</p>}

      {state === "webgl-unsupported" && (
        <>
          <p>이 기기·브라우저는 WebGL을 지원하지 않아 AR을 실행할 수 없습니다.</p>
          <button onClick={onFallback}>비AR로 계속하기</button>
        </>
      )}

      {(state === "camera-denied" || state === "camera-start-failed") && (
        <>
          <p>카메라를 사용할 수 없습니다. 브라우저 설정에서 카메라 권한을 확인하거나 비AR로 계속할 수 있습니다.</p>
          <button onClick={onFallback}>비AR로 계속하기</button>
        </>
      )}

      {/*
        컨테이너는 항상 DOM에 존재해야 한다. start()가 최초 호출되는 시점(state==="idle")에는
        아직 아무 상태 조건도 이 div를 렌더링하지 않아 containerRef.current가 null로 남고,
        useArController.start()의 가드(`if (!containerRef.current) return`)에 걸려 아무 일도
        일어나지 않는 문제가 있었다. 렌더링은 항상 하고 필요 없을 때만 CSS로 숨긴다.
      */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: 280,
          borderRadius: 12,
          overflow: "hidden",
          background: "#000",
          display: ["searching", "slow-search", "fallback-suggested", "found"].includes(state) ? "block" : "none",
        }}
      />

      {state === "searching" && <p>마커를 화면 중앙에 30~50cm 거리에서 비춰주세요.</p>}
      {state === "slow-search" && <p>10초 동안 인식되지 않았습니다. 거리·밝기·마커 반사를 확인해보세요.</p>}
      {state === "fallback-suggested" && (
        <>
          <p>20초 동안 인식되지 않았습니다. 비AR로 계속해도 감점이 없습니다.</p>
          <button onClick={onFallback}>비AR로 계속하기</button>
        </>
      )}
      {state === "found" && (
        <>
          <p>{arObservationText}</p>
          <ObservationVisual targetIndex={targetIndex} />
          <p className="qualitative-tag">30~60초 정도 관찰한 뒤 다음으로 진행하세요.</p>
          <button onClick={onObserved}>관찰 완료, 다음으로</button>
        </>
      )}
    </div>
  );
}
