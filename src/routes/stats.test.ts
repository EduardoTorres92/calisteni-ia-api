import { vi } from "vitest";

import { WeekDay } from "../generated/prisma/enums.js";
import { prismaMock } from "../tests/prisma-mock.js";
import { buildApp } from "../tests/app-helper.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /stats", () => {
  it("should return stats for a valid date range", async () => {
    const mockPlan = {
      id: "plan-id-1",
      userId: "test-user-id",
      workoutDays: [{ id: "day-id-1", weekDay: WeekDay.MONDAY, isRest: false } as any],
    } as any;

    const sessions = [
      { startedAt: new Date("2025-03-03T10:00:00Z"), completedAt: new Date("2025-03-03T10:45:00Z") } as any,
    ];

    prismaMock.workoutPlan.findFirst.mockResolvedValue(mockPlan);
    prismaMock.workoutSession.findMany
      .mockResolvedValueOnce(sessions)
      .mockResolvedValueOnce([]);

    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/stats?from=2025-03-01&to=2025-03-07",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.completedWorkoutsCount).toBe(1);
    expect(body.totalTimeInSeconds).toBe(2700);
  });

  it("should return 404 when no active plan", async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue(null);

    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/stats?from=2025-03-01&to=2025-03-07",
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 400 when missing query params", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/stats" });

    expect(response.statusCode).toBe(400);
  });
});
