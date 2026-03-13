import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  weeklyGoal: number;
}

interface OutputDto {
  weeklyGoal: number;
}

export class UpdateWeeklyGoal {
  async execute(dto: InputDto): Promise<OutputDto> {
    const user = await prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updated = await prisma.user.update({
      where: { id: dto.userId },
      data: { weeklyGoal: dto.weeklyGoal },
    });

    return {
      weeklyGoal: updated.weeklyGoal ?? 5,
    };
  }
}
