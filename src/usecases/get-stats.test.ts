import { vi } from "vitest";

import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { prismaMock } from "../tests/prisma-mock.js";
import { GetStats } from "./get-stats.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GetStats", () => {
  it("should return stats with correct calculations", async () => {
    const mockActivePlan = {
      id: "plan-id-1",
      userId: "user-id-1",
      workoutDays: [{ id: "day-id-1", weekDay: WeekDay.MONDAY, isRest: false } as any],
    } as any;

    const rangeSessions = [
      { startedAt: new Date("2025-03-03T10:00:00Z"), completedAt: new Date("2025-03-03T10:45:00Z") } as any,
      { startedAt: new Date("2025-03-05T09:00:00Z"), completedAt: new Date("2025-03-05T09:30:00Z") } as any,
    ];

    prismaMock.workoutPlan.findFirst.mockResolvedValue(mockActivePlan);
    prismaMock.workoutSession.findMany
      .mockResolvedValueOnce(rangeSessions)
      .mockResolvedValueOnce([]);

    const useCase = new GetStats();
    const result = await useCase.execute({ userId: "user-id-1", from: "2025-03-01", to: "2025-03-07" });

    expect(result.completedWorkoutsCount).toBe(2);
    expect(result.conclusionRate).toBe(1);
    expect(result.totalTimeInSeconds).toBe(2700 + 1800);
    expect(result.consistencyByDay["2025-03-03"]).toEqual({
      workoutDayCompleted: true,
      workoutDayStarted: true,
    });
  });

  it("should throw NotFoundError when no active plan", async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue(null);

    const useCase = new GetStats();

    await expect(
      useCase.execute({ userId: "user-id-1", from: "2025-03-01", to: "2025-03-07" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should return zero values when no sessions", async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue({
      id: "plan-id-1",
      userId: "user-id-1",
      workoutDays: [{ id: "day-id-1", weekDay: WeekDay.MONDAY, isRest: false } as any],
    } as any);
    prismaMock.workoutSession.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const useCase = new GetStats();
    const result = await useCase.execute({ userId: "user-id-1", from: "2025-03-01", to: "2025-03-07" });

    expect(result.completedWorkoutsCount).toBe(0);
    expect(result.conclusionRate).toBe(0);
    expect(result.totalTimeInSeconds).toBe(0);
    expect(result.consistencyByDay).toEqual({});
  });
});
