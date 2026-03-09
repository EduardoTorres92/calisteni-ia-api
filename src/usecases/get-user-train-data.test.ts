import { vi } from "vitest";

import { prismaMock } from "../tests/prisma-mock.js";
import { GetUserTrainData } from "./get-user-train-data.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GetUserTrainData", () => {
  it("should return user train data when all fields are present", async () => {
    const userId = "user-id-1";
    const mockUser = {
      id: userId,
      name: "John Doe",
      weightInGrams: 80000,
      heightInCentimeters: 180,
      age: 30,
      bodyFatPercentage: 15,
    } as any;

    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const useCase = new GetUserTrainData();
    const result = await useCase.execute(userId);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
    });
    expect(result).toEqual({
      userId,
      userName: "John Doe",
      weightInGrams: 80000,
      heightInCentimeters: 180,
      age: 30,
      bodyFatPercentage: 15,
    });
  });

  it("should return null when user not found", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const useCase = new GetUserTrainData();
    const result = await useCase.execute("non-existent-user-id");

    expect(result).toBeNull();
  });

  it("should return null when train data fields are null", async () => {
    const userId = "user-id-1";
    const mockUser = {
      id: userId,
      name: "John Doe",
      weightInGrams: null,
      heightInCentimeters: 180,
      age: 30,
      bodyFatPercentage: 15,
    } as any;

    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const useCase = new GetUserTrainData();
    const result = await useCase.execute(userId);

    expect(result).toBeNull();
  });
});
