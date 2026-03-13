import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

dayjs.extend(utc);

interface InputDto {
  userId: string;
  date?: string;
}

interface OutputDto {
  weeklyGoal: number;
  workoutsCompleted: number;
  progressPercentage: number;
}

export class GetWeeklyProgress {
  async execute(dto: InputDto): Promise<OutputDto> {
    const currentDate = dto.date ? dayjs.utc(dto.date) : dayjs.utc();

    const user = await prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const weeklyGoal = user.weeklyGoal ?? 5;

    const activePlan = await prisma.workoutPlan.findFirst({
      where: { userId: dto.userId, isActive: true },
      select: { id: true, workoutDays: { select: { id: true } } },
    });

    if (!activePlan) {
      return {
        weeklyGoal,
        workoutsCompleted: 0,
        progressPercentage: 0,
      };
    }

    const workoutDayIds = activePlan.workoutDays.map((d) => d.id);
    const weekStart = currentDate.day(0).startOf("day").toDate();
    const weekEnd = currentDate.day(6).endOf("day").toDate();

    const completedCount = await prisma.workoutSession.count({
      where: {
        workoutDayId: { in: workoutDayIds },
        completedAt: { not: null },
        startedAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    const progressPercentage =
      weeklyGoal > 0
        ? Math.min(100, Math.round((completedCount / weeklyGoal) * 100))
        : 0;

    return {
      weeklyGoal,
      workoutsCompleted: completedCount,
      progressPercentage,
    };
  }
}
