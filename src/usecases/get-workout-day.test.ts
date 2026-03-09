import { vi } from "vitest";

import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { prismaMock } from "../tests/prisma-mock.js";
import { GetWorkoutDay } from "./get-workout-day.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GetWorkoutDay", () => {
  it("should return workout day with exercises and sessions", async () => {
    const mockPlan = { id: "plan-id-1", userId: "user-id-1" } as any;
    const mockDay = {
      id: "day-id-1",
      name: "Push Day",
      isRest: false,
      coverImageUrl: null,
      estimatedDurationInSeconds: 3600,
      weekDay: WeekDay.WEDNESDAY,
      workoutExercises: [
        { id: "ex-1", name: "Bench Press", order: 1, workoutDayId: "day-id-1", sets: 3, reps: 10, restTimeInSeconds: 60 } as any,
      ],
      workoutSessions: [
        { id: "session-1", workoutDayId: "day-id-1", startedAt: new Date("2025-03-05T10:00:00Z"), completedAt: new Date("2025-03-05T11:00:00Z") } as any,
      ],
    } as any;

    prismaMock.workoutPlan.findUnique.mockResolvedValue(mockPlan);
    prismaMock.workoutDay.findUnique.mockResolvedValue(mockDay);

    const useCase = new GetWorkoutDay();
    const result = await useCase.execute({ userId: "user-id-1", workoutPlanId: "plan-id-1", workoutDayId: "day-id-1" });

    expect(result.id).toBe("day-id-1");
    expect(result.exercises).toHaveLength(1);
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].startedAt).toBe("2025-03-05");
    expect(result.sessions[0].completedAt).toBe("2025-03-05");
  });

  it("should throw NotFoundError when plan not found", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(null);

    const useCase = new GetWorkoutDay();

    await expect(
      useCase.execute({ userId: "user-id-1", workoutPlanId: "x", workoutDayId: "y" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when day not found", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({ id: "plan-id-1", userId: "user-id-1" } as any);
    prismaMock.workoutDay.findUnique.mockResolvedValue(null);

    const useCase = new GetWorkoutDay();

    await expect(
      useCase.execute({ userId: "user-id-1", workoutPlanId: "plan-id-1", workoutDayId: "x" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should format session dates as YYYY-MM-DD", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({ id: "plan-id-1", userId: "user-id-1" } as any);
    prismaMock.workoutDay.findUnique.mockResolvedValue({
      id: "day-id-1", name: "Rest", isRest: true, coverImageUrl: null, estimatedDurationInSeconds: 0, weekDay: WeekDay.SUNDAY,
      workoutExercises: [],
      workoutSessions: [
        { id: "s1", workoutDayId: "day-id-1", startedAt: new Date("2025-12-31T23:59:00Z"), completedAt: new Date("2026-01-01T00:30:00Z") } as any,
      ],
    } as any);

    const useCase = new GetWorkoutDay();
    const result = await useCase.execute({ userId: "user-id-1", workoutPlanId: "plan-id-1", workoutDayId: "day-id-1" });

    expect(result.sessions[0].startedAt).toBe("2025-12-31");
    expect(result.sessions[0].completedAt).toBe("2026-01-01");
  });
});
