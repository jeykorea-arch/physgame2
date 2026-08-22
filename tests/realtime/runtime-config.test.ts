import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("실행 패키지 Firebase 설정", () => {
  it("완전한 firebase-config.json을 재빌드 없이 읽는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          enabled: true,
          apiKey: "api",
          authDomain: "project.example",
          projectId: "project-echo",
          databaseURL: "https://project.example",
          appId: "app",
        }),
      }),
    );

    const config = await import("../../src/env");
    await config.loadRuntimeFirebaseConfig();

    expect(config.isRealtimeTeacherBoardConfigured()).toBe(true);
    expect(config.getRealtimeFirebaseConfig().projectId).toBe("project-echo");
  });

  it("필드가 빠진 설정은 실시간 기능을 켜지 않는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ enabled: true, apiKey: "api" }),
      }),
    );

    const config = await import("../../src/env");
    await config.loadRuntimeFirebaseConfig();

    expect(config.isRealtimeTeacherBoardConfigured()).toBe(false);
  });
});
