import { vi } from "vitest";

import { WeekDay } from "../generated/prisma/enums.js";
import { prismaMock } from "../tests/prisma-mock.js";
import { CreateWorkoutPlan } from "./create-workout-plan.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CreateWorkoutPlan", () => {
  it("should create a workout plan and return it", async () => {
    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock) as any);

    const mockResult = {
      id: "plan-id-new",
      name: "My Plan",
      workoutDays: [
        {
          id: "day-id-1",
          name: "Push Day",
          weekDay: WeekDay.MONDAY,
          isRest: false,
          estimatedDurationInSeconds: 3600,
          coverImageUrl: null,
          workoutExercises: [
            { id: "ex-1", name: "Bench Press", order: 1, sets: 3, reps: 10, restTimeInSeconds: 60 } as any,
          ],
        },
      ],
    } as any;

    prismaMock.workoutPlan.findFirst.mockResolvedValue(null);
    prismaMock.workoutPlan.create.mockResolvedValue({ id: "plan-id-new" } as any);
    prismaMock.workoutPlan.findUnique.mockResolvedValue(mockResult);

    const useCase = new CreateWorkoutPlan();
    const result = await useCase.execute({
      userId: "user-id-1",
      name: "My Plan",
      workoutDays: [
        {
          name: "Push Day",
          weekDay: WeekDay.MONDAY,
          isRest: false,
          estimatedDurationInSeconds: 3600,
          exercises: [
            { order: 1, name: "Bench Press", sets: 3, reps: 10, restTimeInSeconds: 60 },
          ],
        },
      ],
    });

    expect(result.id).toBe("plan-id-new");
    expect(result.name).toBe("My Plan");
    expect(result.workoutDays).toHaveLength(1);
    expect(result.workoutDays[0].exercises).toHaveLength(1);
    expect(prismaMock.workoutPlan.update).not.toHaveBeenCalled();
  });

  it("should deactivate existing active plan before creating new one", async () => {
    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock) as any);

    prismaMock.workoutPlan.findFirst.mockResolvedValue({ id: "old-plan-id", isActive: true } as any);
    prismaMock.workoutPlan.update.mockResolvedValue({} as any);
    prismaMock.workoutPlan.create.mockResolvedValue({ id: "new-plan-id" } as any);
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      id: "new-plan-id",
      name: "New Plan",
      workoutDays: [
        {
          id: "day-id-1", name: "Leg Day", weekDay: WeekDay.WEDNESDAY, isRest: false,
          estimatedDurationInSeconds: 2700, coverImageUrl: null, workoutExercises: [],
        },
      ],
    } as any);

    const useCase = new CreateWorkoutPlan();
    await useCase.execute({
      userId: "user-id-1",
      name: "New Plan",
      workoutDays: [
        { name: "Leg Day", weekDay: WeekDay.WEDNESDAY, isRest: false, estimatedDurationInSeconds: 2700, exercises: [] },
      ],
    });

    expect(prismaMock.workoutPlan.update).toHaveBeenCalledWith({
      where: { id: "old-plan-id" },
      data: { isActive: false },
    });
  });
});
