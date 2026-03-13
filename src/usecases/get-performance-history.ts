import dayjs from "dayjs";

import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  from?: string;
  to?: string;
  exerciseName?: string;
  limit?: number;
}

interface DataPointDto {
  date: string;
  exerciseName: string;
  targetReps: number;
  actualReps: number;
  difficulty: number;
  completed: boolean;
}

interface OutputDto {
  history: DataPointDto[];
}

export class GetPerformanceHistory {
  async execute(dto: InputDto): Promise<OutputDto> {
    const where: {
      userId: string;
      exerciseName?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = { userId: dto.userId };

    if (dto.exerciseName) {
      where.exerciseName = dto.exerciseName;
    }

    if (dto.from ?? dto.to) {
      where.createdAt = {};
      if (dto.from) {
        where.createdAt.gte = dayjs(dto.from).startOf("day").toDate();
      }
      if (dto.to) {
        where.createdAt.lte = dayjs(dto.to).endOf("day").toDate();
      }
    }

    const records = await prisma.exercisePerformanceRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: dto.limit ?? 100,
    });

    const history: DataPointDto[] = records
      .reverse()
      .map((r) => ({
      date: dayjs(r.createdAt).format("YYYY-MM-DD"),
      exerciseName: r.exerciseName,
      targetReps: r.targetReps,
      actualReps: r.actualReps,
      difficulty: r.difficulty,
      completed: r.completed,
    }));

    return { history: history };
  }
}
