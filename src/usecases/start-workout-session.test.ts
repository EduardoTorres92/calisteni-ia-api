import { vi } from "vitest";

import {
  ConflictError,
  NotFoundError,
  WorkoutPlanNotActiveError,
} from "../errors/index.js";
import { prismaMock } from "../tests/prisma-mock.js";
import { StartWorkoutSession } from "./start-workout-session.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("StartWorkoutSession", () => {
  it("should create and return a new workout session", async () => {
    const mockPlan = { id: "plan-id-1", userId: "user-id-1", isActive: true } as any;
    const mockDay = { id: "day-id-1", workoutPlanId: "plan-id-1" } as any;
    const mockSession = { id: "session-id-1", workoutDayId: "day-id-1", startedAt: new Date() } as any;

    prismaMock.workoutPlan.findUnique.mockResolvedValue(mockPlan);
    prismaMock.workoutDay.findUnique.mockResolvedValue(mockDay);
    prismaMock.workoutSession.findFirst.mockResolvedValue(null);
    prismaMock.workoutSession.create.mockResolvedValue(mockSession);

    const useCase = new StartWorkoutSession();
    const result = await useCase.execute({
      userId: "user-id-1",
      workoutPlanId: "plan-id-1",
      workoutDayId: "day-id-1",
    });

    expect(result.userWorkoutSessionId).toBe("session-id-1");
  });

  it("should throw NotFoundError when plan not found", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(null);

    const useCase = new StartWorkoutSession();

    await expect(
      useCase.execute({ userId: "user-id-1", workoutPlanId: "x", workoutDayId: "y" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when userId doesn't match", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      id: "plan-id-1", userId: "different-user", isActive: true,
    } as any);

    const useCase = new StartWorkoutSession();

    await expect(
      useCase.execute({ userId: "user-id-1", workoutPlanId: "plan-id-1", workoutDayId: "y" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw WorkoutPlanNotActiveError when plan is inactive", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      id: "plan-id-1", userId: "user-id-1", isActive: false,
    } as any);

    const useCase = new StartWorkoutSession();

    await expect(
      useCase.execute({ userId: "user-id-1", workoutPlanId: "plan-id-1", workoutDayId: "y" }),
    ).rejects.toThrow(WorkoutPlanNotActiveError);
  });

  it("should throw NotFoundError when day not found", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      id: "plan-id-1", userId: "user-id-1", isActive: true,
    } as any);
    prismaMock.workoutDay.findUnique.mockResolvedValue(null);

    const useCase = new StartWorkoutSession();

    await expect(
      useCase.execute({ userId: "user-id-1", workoutPlanId: "plan-id-1", workoutDayId: "x" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ConflictError when session already exists", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      id: "plan-id-1", userId: "user-id-1", isActive: true,
    } as any);
    prismaMock.workoutDay.findUnique.mockResolvedValue({
      id: "day-id-1", workoutPlanId: "plan-id-1",
    } as any);
    prismaMock.workoutSession.findFirst.mockResolvedValue({
      id: "existing", workoutDayId: "day-id-1", startedAt: new Date(),
    } as any);

    const useCase = new StartWorkoutSession();

    await expect(
      useCase.execute({ userId: "user-id-1", workoutPlanId: "plan-id-1", workoutDayId: "day-id-1" }),
    ).rejects.toThrow(ConflictError);
  });
});
