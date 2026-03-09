import { vi } from "vitest";

import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { prismaMock } from "../tests/prisma-mock.js";
import { GetWorkoutPlan } from "./get-workout-plan.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GetWorkoutPlan", () => {
  it("should return workout plan with exercise count", async () => {
    const userId = "user-id-1";
    const planId = "plan-id-1";
    const dayId = "day-id-1";

    const mockWorkoutPlan = {
      id: planId,
      name: "Strength Plan",
      userId,
      workoutDays: [
        {
          id: dayId,
          weekDay: WeekDay.MONDAY,
          name: "Push Day",
          isRest: false,
          coverImageUrl: null,
          estimatedDurationInSeconds: 3600,
          workoutExercises: [
            { id: "ex-1", name: "Bench Press" } as any,
            { id: "ex-2", name: "Squat" } as any,
          ],
        },
      ],
    } as any;

    prismaMock.workoutPlan.findUnique.mockResolvedValue(mockWorkoutPlan);

    const useCase = new GetWorkoutPlan();
    const result = await useCase.execute({ userId, workoutPlanId: planId });

    expect(result.id).toBe(planId);
    expect(result.name).toBe("Strength Plan");
    expect(result.workoutDays).toHaveLength(1);
    expect(result.workoutDays[0].exercisesCount).toBe(2);
  });

  it("should throw NotFoundError when plan not found", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(null);

    const useCase = new GetWorkoutPlan();

    await expect(
      useCase.execute({ userId: "user-id-1", workoutPlanId: "non-existent" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when userId doesn't match", async () => {
    const mockWorkoutPlan = {
      id: "plan-id-1",
      name: "Strength Plan",
      userId: "different-user-id",
      workoutDays: [],
    } as any;

    prismaMock.workoutPlan.findUnique.mockResolvedValue(mockWorkoutPlan);

    const useCase = new GetWorkoutPlan();

    await expect(
      useCase.execute({ userId: "user-id-1", workoutPlanId: "plan-id-1" }),
    ).rejects.toThrow(NotFoundError);
  });
});
