import { vi } from "vitest";

import { WeekDay } from "../generated/prisma/enums.js";
import { prismaMock } from "../tests/prisma-mock.js";
import { buildApp } from "../tests/app-helper.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /workout-plans", () => {
  it("should return list of workout plans", async () => {
    prismaMock.workoutPlan.findMany.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Plan A",
        isActive: true,
        workoutDays: [
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            name: "Push",
            weekDay: WeekDay.MONDAY,
            isRest: false,
            coverImageUrl: null,
            estimatedDurationInSeconds: 3600,
            workoutExercises: [
              {
                id: "550e8400-e29b-41d4-a716-446655440002",
                name: "Bench",
                order: 1,
                workoutDayId: "550e8400-e29b-41d4-a716-446655440001",
                sets: 3,
                reps: 10,
                restTimeInSeconds: 60,
              },
            ],
          },
        ],
      },
    ] as any);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/workout-plans" });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Plan A");
  });
});

describe("POST /workout-plans", () => {
  it("should create a workout plan", async () => {
    const planId = "550e8400-e29b-41d4-a716-446655440000";

    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock) as any);
    prismaMock.workoutPlan.findFirst.mockResolvedValue(null);
    prismaMock.workoutPlan.create.mockResolvedValue({ id: planId } as any);
    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      id: planId,
      name: "My Plan",
      workoutDays: [
        {
          name: "Push Day",
          weekDay: WeekDay.MONDAY,
          isRest: false,
          estimatedDurationInSeconds: 3600,
          coverImageUrl: null,
          workoutExercises: [
            { order: 1, name: "Bench", sets: 3, reps: 10, restTimeInSeconds: 60 },
          ],
        },
      ],
    } as any);

    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/workout-plans",
      payload: {
        name: "My Plan",
        workoutDays: [
          {
            name: "Push Day",
            weekDay: "MONDAY",
            isRest: false,
            estimatedDurationInSeconds: 3600,
            coverImageUrl: null,
            exercises: [
              { order: 1, name: "Bench", sets: 3, reps: 10, restTimeInSeconds: 60 },
            ],
          },
        ],
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toBe(planId);
  });
});

describe("GET /workout-plans/:id", () => {
  it("should return a workout plan by ID", async () => {
    const planId = "550e8400-e29b-41d4-a716-446655440000";

    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      id: planId,
      name: "Strength Plan",
      userId: "test-user-id",
      workoutDays: [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          weekDay: WeekDay.MONDAY,
          name: "Push Day",
          isRest: false,
          coverImageUrl: null,
          estimatedDurationInSeconds: 3600,
          workoutExercises: [{ id: "ex-1" }, { id: "ex-2" }],
        },
      ],
    } as any);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: `/workout-plans/${planId}` });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.id).toBe(planId);
    expect(body.workoutDays[0].exercisesCount).toBe(2);
  });

  it("should return 404 when plan not found", async () => {
    prismaMock.workoutPlan.findUnique.mockResolvedValue(null);

    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/workout-plans/550e8400-e29b-41d4-a716-446655440000",
    });

    expect(response.statusCode).toBe(404);
  });
});

describe("GET /workout-plans/:id/days/:id", () => {
  it("should return a workout day with exercises and sessions", async () => {
    const planId = "550e8400-e29b-41d4-a716-446655440000";
    const dayId = "550e8400-e29b-41d4-a716-446655440001";

    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      id: planId, userId: "test-user-id",
    } as any);
    prismaMock.workoutDay.findUnique.mockResolvedValue({
      id: dayId,
      name: "Push Day",
      isRest: false,
      coverImageUrl: null,
      estimatedDurationInSeconds: 3600,
      weekDay: WeekDay.MONDAY,
      workoutExercises: [
        { id: "550e8400-e29b-41d4-a716-446655440002", name: "Bench", order: 1, workoutDayId: dayId, sets: 3, reps: 10, restTimeInSeconds: 60 },
      ],
      workoutSessions: [
        { id: "550e8400-e29b-41d4-a716-446655440003", workoutDayId: dayId, startedAt: new Date("2025-03-05T10:00:00Z"), completedAt: new Date("2025-03-05T11:00:00Z") },
      ],
    } as any);

    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: `/workout-plans/${planId}/days/${dayId}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.exercises).toHaveLength(1);
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0].startedAt).toBe("2025-03-05");
  });
});

describe("POST /workout-plans/:id/days/:id/sessions", () => {
  it("should start a workout session", async () => {
    const planId = "550e8400-e29b-41d4-a716-446655440000";
    const dayId = "550e8400-e29b-41d4-a716-446655440001";
    const sessionId = "550e8400-e29b-41d4-a716-446655440002";

    prismaMock.workoutPlan.findUnique.mockResolvedValue({
      id: planId, userId: "test-user-id", isActive: true,
    } as any);
    prismaMock.workoutDay.findUnique.mockResolvedValue({
      id: dayId, workoutPlanId: planId,
    } as any);
    prismaMock.workoutSession.findFirst.mockResolvedValue(null);
    prismaMock.workoutSession.create.mockResolvedValue({
      id: sessionId, workoutDayId: dayId, startedAt: new Date(),
    } as any);

    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: `/workout-plans/${planId}/days/${dayId}/sessions`,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().userWorkoutSessionId).toBe(sessionId);
  });
});

describe("PATCH /workout-plans/:id/days/:id/sessions/:id", () => {
  it("should complete a workout session", async () => {
    const planId = "550e8400-e29b-41d4-a716-446655440000";
    const dayId = "550e8400-e29b-41d4-a716-446655440001";
    const sessionId = "550e8400-e29b-41d4-a716-446655440002";
    const startedAt = new Date("2025-03-05T10:00:00Z");
    const completedAt = "2025-03-05T11:30:00.000Z";

    prismaMock.workoutPlan.findUnique.mockResolvedValue({ id: planId, userId: "test-user-id" } as any);
    prismaMock.workoutDay.findUnique.mockResolvedValue({ id: dayId, workoutPlanId: planId } as any);
    prismaMock.workoutSession.findUnique.mockResolvedValue({ id: sessionId, startedAt, completedAt: null } as any);
    prismaMock.workoutSession.update.mockResolvedValue({
      id: sessionId, startedAt, completedAt: new Date(completedAt),
    } as any);

    const app = await buildApp();
    const response = await app.inject({
      method: "PATCH",
      url: `/workout-plans/${planId}/days/${dayId}/sessions/${sessionId}`,
      payload: { completedAt },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.id).toBe(sessionId);
    expect(body.completedAt).toBe(completedAt);
  });
});
