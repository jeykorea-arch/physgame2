import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RealtimeJoinScreen } from "../../src/realtime/RealtimeJoinScreen";

describe("학생 실시간 수업 닉네임 화면", () => {
  it("차시 입장 전에 익명 별칭 입력란과 교사용 화면 안내를 보여준다", () => {
    const markup = renderToStaticMarkup(
      <RealtimeJoinScreen classCode="123456" onJoin={async () => undefined} onSkip={() => undefined} />,
    );
    expect(markup).toContain("수업용 별칭을 입력하세요");
    expect(markup).toContain("선생님 화면에 이 별칭으로만 표시됩니다");
    expect(markup).toContain("수업용 별칭");
    expect(markup).not.toContain("연결 없이 계속하기");
  });

  it("같은 수업의 저장된 별칭을 다시 확인할 수 있게 미리 채운다", () => {
    const markup = renderToStaticMarkup(
      <RealtimeJoinScreen classCode="123456" initialAlias="파랑고래" onJoin={async () => undefined} onSkip={() => undefined} />,
    );
    expect(markup).toContain('value="파랑고래"');
  });
});
