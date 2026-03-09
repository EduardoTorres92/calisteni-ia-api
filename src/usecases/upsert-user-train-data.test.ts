import { vi } from "vitest";

import { prismaMock } from "../tests/prisma-mock.js";
import { UpsertUserTrainData } from "./upsert-user-train-data.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UpsertUserTrainData", () => {
  it("should update and return user train data", async () => {
    const userId = "user-id-1";
    const dto = {
      userId,
      weightInGrams: 80000,
      heightInCentimeters: 180,
      age: 30,
      bodyFatPercentage: 15,
    };

    const mockUpdatedUser = {
      id: userId,
      weightInGrams: 80000,
      heightInCentimeters: 180,
      age: 30,
      bodyFatPercentage: 15,
    } as any;

    prismaMock.user.update.mockResolvedValue(mockUpdatedUser);

    const useCase = new UpsertUserTrainData();
    const result = await useCase.execute(dto);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        weightInGrams: dto.weightInGrams,
        heightInCentimeters: dto.heightInCentimeters,
        age: dto.age,
        bodyFatPercentage: dto.bodyFatPercentage,
      },
    });
    expect(result).toEqual({
      userId,
      weightInGrams: 80000,
      heightInCentimeters: 180,
      age: 30,
      bodyFatPercentage: 15,
    });
  });
});
