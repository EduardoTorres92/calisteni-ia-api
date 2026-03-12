import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number;
  calisthenicsLevel?: string;
  availableEquipment?: string[];
}

interface OutputDto {
  userId: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number;
  calisthenicsLevel: string | null;
  availableEquipment: string[];
}

export class UpsertUserTrainData {
  async execute(dto: InputDto): Promise<OutputDto> {
    const user = await prisma.user.update({
      where: { id: dto.userId },
      data: {
        weightInGrams: dto.weightInGrams,
        heightInCentimeters: dto.heightInCentimeters,
        age: dto.age,
        bodyFatPercentage: dto.bodyFatPercentage,
        ...(dto.calisthenicsLevel !== undefined && {
          calisthenicsLevel: dto.calisthenicsLevel,
        }),
        ...(dto.availableEquipment !== undefined && {
          availableEquipment: dto.availableEquipment,
        }),
      },
    });

    return {
      userId: user.id,
      weightInGrams: user.weightInGrams!,
      heightInCentimeters: user.heightInCentimeters!,
      age: user.age!,
      bodyFatPercentage: user.bodyFatPercentage!,
      calisthenicsLevel: user.calisthenicsLevel,
      availableEquipment: user.availableEquipment,
    };
  }
}
