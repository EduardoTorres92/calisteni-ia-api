import { vi } from "vitest";

import { WeekDay } from "../generated/prisma/enums.js";
import { prismaMock } from "../tests/prisma-mock.js";
import { buildApp } from "../tests/app-helper.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /home/:date", () => {
  it("should return home data for a valid date", async () => {
    const planId = "550e8400-e29b-41d4-a716-446655440000";
    const dayId = "550e8400-e29b-41d4-a716-446655440001";

    const mockPlan = {
      id: planId,
      userId: "test-user-id",
      workoutDays: [
        {
          id: dayId,
          name: "Push Day",
          weekDay: WeekDay.WEDNESDAY,
          isRest: false,
          estimatedDurationInSeconds: 3600,
          coverImageUrl: null,
          workoutExercises: [{ id: "550e8400-e29b-41d4-a716-446655440002" } as any],
        },
      ],
    } as any;

    prismaMock.workoutPlan.findFirst.mockResolvedValue(mockPlan);
    prismaMock.workoutSession.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/home/2025-03-05" });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.activeWorkoutPlanId).toBe(planId);
    expect(body.todayWorkoutDay.weekDay).toBe(WeekDay.WEDNESDAY);
  });

  it("should return 404 when no active plan", async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue(null);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/home/2025-03-05" });

    expect(response.statusCode).toBe(404);
    expect(response.json().code).toBe("NOT_FOUND");
  });

  it("should return 400 for invalid date format", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/home/not-a-date" });

    expect(response.statusCode).toBe(400);
  });
});
