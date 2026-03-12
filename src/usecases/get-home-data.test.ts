import { vi } from "vitest";

import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { prismaMock } from "../tests/prisma-mock.js";
import { GetHomeData } from "./get-home-data.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GetHomeData", () => {
  it("should return home data for a given date", async () => {
    const date = "2025-03-05"; // Wednesday

    const mockActivePlan = {
      id: "plan-id-1",
      userId: "user-id-1",
      workoutDays: [
        {
          id: "day-wed-id",
          name: "Push Day",
          weekDay: WeekDay.WEDNESDAY,
          isRest: false,
          estimatedDurationInSeconds: 3600,
          coverImageUrl: null,
          workoutExercises: [
            { id: "ex-1", name: "Bench Press" } as any,
            { id: "ex-2", name: "Squat" } as any,
          ],
        },
      ],
    } as any;

    const weekSessions = [
      { startedAt: new Date("2025-03-05T10:00:00Z"), completedAt: new Date("2025-03-05T11:00:00Z") } as any,
    ];

    const allSessions = [
      { startedAt: new Date("2025-03-05T10:00:00Z"), completedAt: new Date("2025-03-05T11:00:00Z") } as any,
    ];

    prismaMock.workoutPlan.findFirst.mockResolvedValue(mockActivePlan);
    prismaMock.workoutSession.findMany
      .mockResolvedValueOnce(weekSessions)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(allSessions);

    const useCase = new GetHomeData();
    const result = await useCase.execute({ userId: "user-id-1", date });

    expect(result.activeWorkoutPlanId).toBe("plan-id-1");
    expect(result.todayWorkoutDay.id).toBe("day-wed-id");
    expect(result.todayWorkoutDay.weekDay).toBe(WeekDay.WEDNESDAY);
    expect(result.todayWorkoutDay.exercisesCount).toBe(2);
    expect(result.workoutStreak).toBe(0);
    expect(result.consistencyByDay["2025-03-05"]).toEqual({
      workoutDayCompleted: true,
      workoutDayStarted: true,
    });
    expect(result.completedWorkoutsCount).toBe(1);
    expect(result.consistencyPercent).toBe(100);
  });

  it("should throw NotFoundError when no active plan", async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue(null);

    const useCase = new GetHomeData();

    await expect(
      useCase.execute({ userId: "user-id-1", date: "2025-03-05" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should return home data with todayWorkoutDay undefined when no workout day for today", async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue({
      id: "plan-id-1",
      userId: "user-id-1",
      workoutDays: [
        { id: "day-mon-id", name: "Leg Day", weekDay: WeekDay.MONDAY, isRest: false, estimatedDurationInSeconds: 3600, coverImageUrl: null, workoutExercises: [] },
      ],
    } as any);
    prismaMock.workoutSession.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const useCase = new GetHomeData();
    const result = await useCase.execute({ userId: "user-id-1", date: "2025-03-05" });

    expect(result.todayWorkoutDay).toBeUndefined();
    expect(result.activeWorkoutPlanId).toBe("plan-id-1");
    expect(result.completedWorkoutsCount).toBe(0);
    expect(result.consistencyPercent).toBe(0);
  });
});
