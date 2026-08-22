import type { LessonMeta } from "../content/types";
import type { LessonMode } from "../storage/models";

interface EntryScreenProps {
  lessonMeta: LessonMeta;
  storyIntro: string;
  onChooseMode: (mode: LessonMode) => void;
}

export function EntryScreen({ lessonMeta, storyIntro, onChooseMode }: EntryScreenProps) {
  return (
    <div className="screen">
      <div className="panel">
        <span className="badge">{lessonMeta.id}차시</span>
        <h1>{lessonMeta.title}</h1>
        <p>{storyIntro}</p>
      </div>
      <div className="panel">
        <p>자리에 앉은 채로 마커를 촬영합니다. 카메라를 보며 이동하지 마세요.</p>
        <p className="qualitative-tag">카메라 영상은 기기 내 인식에만 사용되며 저장·전송되지 않습니다.</p>
        <button onClick={() => onChooseMode("ar")}>AR로 시작하기</button>
        <button className="secondary" onClick={() => onChooseMode("non-ar")}>
          비AR로 시작하기(카메라 없이)
        </button>
      </div>
    </div>
  );
}
