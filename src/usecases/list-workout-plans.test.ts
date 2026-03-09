import { vi } from "vitest";

import { WeekDay } from "../generated/prisma/enums.js";
import { prismaMock } from "../tests/prisma-mock.js";
import { ListWorkoutPlans } from "./list-workout-plans.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ListWorkoutPlans", () => {
  it("should return all workout plans for user", async () => {
    const userId = "user-id-1";
    const mockPlans = [
      {
        id: "plan-id-1",
        name: "Plan A",
        isActive: true,
        workoutDays: [
          {
            id: "day-id-1",
            name: "Push",
            weekDay: WeekDay.MONDAY,
            isRest: false,
            coverImageUrl: null,
            estimatedDurationInSeconds: 3600,
            workoutExercises: [
              {
                id: "ex-1",
                name: "Bench",
                order: 1,
                workoutDayId: "day-id-1",
                sets: 3,
                reps: 10,
                restTimeInSeconds: 60,
              } as any,
            ],
          },
        ],
      },
    ] as any;

    prismaMock.workoutPlan.findMany.mockResolvedValue(mockPlans);

    const useCase = new ListWorkoutPlans();
    const result = await useCase.execute({ userId });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("plan-id-1");
    expect(result[0].workoutDays[0].exercises).toHaveLength(1);
  });

  it("should filter by active status when provided", async () => {
    prismaMock.workoutPlan.findMany.mockResolvedValue([]);

    const useCase = new ListWorkoutPlans();
    await useCase.execute({ userId: "user-id-1", active: true });

    expect(prismaMock.workoutPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-id-1", isActive: true },
      }),
    );
  });

  it("should return empty array when no plans found", async () => {
    prismaMock.workoutPlan.findMany.mockResolvedValue([]);

    const useCase = new ListWorkoutPlans();
    const result = await useCase.execute({ userId: "user-id-1" });

    expect(result).toEqual([]);
  });
});
