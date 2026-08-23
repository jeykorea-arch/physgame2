import { describe, expect, it } from "vitest";
import type { StudentRealtimeRecord } from "../../src/realtime/types";
import {
  buildStudentJoinUrl,
  buildLessonEntryUrl,
  isStudentOnline,
  progressLabel,
  progressPercent,
  summarizeRoster,
} from "../../src/realtime/teacherDashboard";

const NOW = 1_800_000_000_000;

function student(overrides: Partial<StudentRealtimeRecord> = {}): StudentRealtimeRecord {
  return {
    alias: "파랑고래",
    connected: true,
    lessonId: 1,
    phase: "game",
    mode: "ar",
    gameStage: "missions",
    completedMissionCount: 1,
    currentMissionId: "L1-M2",
    completedQuestionCount: 0,
    score: 0,
    lastSeenAt: NOW - 10_000,
    ...overrides,
  };
}

describe("교사용 실시간 진행판", () => {
  it("선택한 차시와 수업 코드를 QR 주소에 함께 넣는다", () => {
    expect(buildStudentJoinUrl("https://school.example/physgame2/?old=1#/teacher", "123456", 2)).toBe(
      "https://school.example/physgame2/?class=123456&lesson=2",
    );
  });

  it("실시간 연결 전에도 선택한 차시로 바로 가는 QR 주소를 만든다", () => {
    expect(buildLessonEntryUrl("https://school.example/physgame2/?teacher=1", 1)).toBe(
      "https://school.example/physgame2/?lesson=1",
    );
  });

  it("90초 이내 heartbeat가 있는 학생만 현재 접속으로 센다", () => {
    const roster = {
      online: student(),
      stale: student({ alias: "느린별", lastSeenAt: NOW - 91_000 }),
      done: student({ alias: "완료별", phase: "complete", completedMissionCount: 2, completedQuestionCount: 4, score: 40 }),
      lesson2: student({ alias: "둘째별", lessonId: 2 }),
      fallback: student({ alias: "대체별", mode: "non-ar" }),
    };

    expect(isStudentOnline(roster.online, NOW)).toBe(true);
    expect(isStudentOnline(roster.stale, NOW)).toBe(false);
    expect(summarizeRoster(roster, 1, NOW)).toEqual({ total: 4, connected: 3, active: 2, completed: 1, nonAr: 1 });
  });

  it("차시별 미션 수와 문항 수로 진행률과 현재 위치를 만든다", () => {
    const inMission = student({ lessonId: 2, completedMissionCount: 2, gameStage: "missions" });
    const inQuestion = student({ lessonId: 2, completedMissionCount: 3, completedQuestionCount: 2, gameStage: "questions", score: 17 });

    expect(progressLabel(inMission)).toBe("핵심 게임 · 미션 2/3");
    expect(progressPercent(inMission)).toBe(40);
    expect(progressLabel(inQuestion)).toBe("핵심 게임 · 문항 2/4");
    expect(progressPercent(inQuestion)).toBe(70);
    expect(progressPercent(student({ phase: "complete" }))).toBe(100);
  });

  it("닉네임만 등록한 학생은 시작 방식 선택 전으로 표시하고 비AR 인원에는 넣지 않는다", () => {
    const waiting = student({ phase: "entry", mode: "non-ar", completedMissionCount: 0, currentMissionId: "" });
    expect(progressLabel(waiting)).toBe("접속 · 시작 방식 선택 전");
    expect(progressPercent(waiting)).toBe(5);
    expect(summarizeRoster({ waiting }, 1, NOW).nonAr).toBe(0);
  });
});
