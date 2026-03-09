import { vi } from "vitest";

import { NotFoundError } from "../errors/index.js";
import { prismaMock } from "../tests/prisma-mock.js";
import { CompleteWorkoutSession } from "./complete-workout-session.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CompleteWorkoutSession", () => {
  it("should complete a workout session and return ISO dates", async () => {
    const startedAt = new Date("2025-03-05T10:00:00Z");
    const completedAt = "2025-03-05T11:30:00Z";

    prismaMock.workoutPlan.findUnique.mockResolvedValue({ id: "plan-id-1", userId: "user-id-1" } as any);
    prismaMock.workoutDay.findUnique.mockResolvedValue({ id: "day-id-1", workoutPlanId: "plan-id-1" } as any);
    prismaMock.workoutSession.findUnique.mockResolvedValue({ id: "session-id-1", startedAt, completedAt: null } as any);
    prismaMock.workoutSession.update.mockResolvedValue({
      id: "session-id-1", startedAt, completedAt: new Date(completedAt),
    } as any);

    const useCase = new CompleteWorkoutSession();
    const result = await useCase.execute({
      userId: "user-id-1",
      workoutPlanId: "plan-id-1",
      workoutDayId: "day-id-1",
      sessionId: "session-id-1",
      completedAt,
    });

    expect(result).toEqual({
      id: "session-id-1",
      startedAt: startedAt.toISOString(),
      completedAt: new Date(completedAt).toISOString(),
    });
  });

  it("should throw NotFoundError when plan not found", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(null);

    const useCase = new CompleteWorkoutSession();

    await expect(
      useCase.execute({
        userId: "user-id-1", workoutPlanId: "x", workoutDayId: "y", sessionId: "z", completedAt: "2025-03-05T11:00:00Z",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when day not found", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({ id: "plan-id-1", userId: "user-id-1" } as any);
    prismaMock.workoutDay.findUnique.mockResolvedValue(null);

    const useCase = new CompleteWorkoutSession();

    await expect(
      useCase.execute({
        userId: "user-id-1", workoutPlanId: "plan-id-1", workoutDayId: "x", sessionId: "z", completedAt: "2025-03-05T11:00:00Z",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when session not found", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue({ id: "plan-id-1", userId: "user-id-1" } as any);
    prismaMock.workoutDay.findUnique.mockResolvedValue({ id: "day-id-1", workoutPlanId: "plan-id-1" } as any);
    prismaMock.workoutSession.findUnique.mockResolvedValue(null);

    const useCase = new CompleteWorkoutSession();

    await expect(
      useCase.execute({
        userId: "user-id-1", workoutPlanId: "plan-id-1", workoutDayId: "day-id-1", sessionId: "x", completedAt: "2025-03-05T11:00:00Z",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
