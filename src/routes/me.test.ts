import { vi } from "vitest";

import { prismaMock } from "../tests/prisma-mock.js";
import { buildApp } from "../tests/app-helper.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /me", () => {
  it("should return user train data", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "test-user-id",
      name: "Test User",
      weightInGrams: 80000,
      heightInCentimeters: 180,
      age: 25,
      bodyFatPercentage: 0.15,
    } as any);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/me" });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.userId).toBe("test-user-id");
    expect(body.userName).toBe("Test User");
    expect(body.weightInGrams).toBe(80000);
  });

  it("should return null when no train data", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "test-user-id",
      name: "Test User",
      weightInGrams: null,
      heightInCentimeters: null,
      age: null,
      bodyFatPercentage: null,
    } as any);

    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/me" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toBeNull();
  });
});

describe("PUT /me", () => {
  it("should update user train data", async () => {
    prismaMock.user.update.mockResolvedValue({
      id: "test-user-id",
      weightInGrams: 75000,
      heightInCentimeters: 175,
      age: 30,
      bodyFatPercentage: 0.12,
    } as any);

    const app = await buildApp();
    const response = await app.inject({
      method: "PUT",
      url: "/me",
      payload: {
        weightInGrams: 75000,
        heightInCentimeters: 175,
        age: 30,
        bodyFatPercentage: 0.12,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.userId).toBe("test-user-id");
    expect(body.weightInGrams).toBe(75000);
  });

  it("should reject invalid body", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "PUT",
      url: "/me",
      payload: { weightInGrams: -1 },
    });

    expect(response.statusCode).toBe(400);
  });
});
