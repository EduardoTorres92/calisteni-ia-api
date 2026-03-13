import { Prisma } from "../generated/prisma/client.js";
import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface PerformanceItemDto {
  workoutExerciseId: string;
  targetReps: number;
  actualReps: number;
  difficulty: number;
  completed: boolean;
}

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
  sessionId: string;
  completedAt: string;
  performance?: PerformanceItemDto[];
}

interface OutputDto {
  id: string;
  startedAt: string;
  completedAt: string;
}

export class CompleteWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
    });

    if (!workoutPlan || workoutPlan.userId !== dto.userId) {
      throw new NotFoundError("Workout plan not found");
    }

    const workoutDay = await prisma.workoutDay.findUnique({
      where: { id: dto.workoutDayId, workoutPlanId: dto.workoutPlanId },
      include: { workoutExercises: true },
    });

    if (!workoutDay) {
      throw new NotFoundError("Workout day not found");
    }

    const session = await prisma.workoutSession.findUnique({
      where: { id: dto.sessionId, workoutDayId: dto.workoutDayId },
    });

    if (!session) {
      throw new NotFoundError("Workout session not found");
    }

    const exerciseNamesById = new Map(
      workoutDay.workoutExercises.map((e) => [e.id, e.name]),
    );

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedSession = await tx.workoutSession.update({
        where: { id: dto.sessionId },
        data: { completedAt: new Date(dto.completedAt) },
      });

      if (dto.performance?.length) {
        const validExerciseIds = new Set(workoutDay.workoutExercises.map((e) => e.id));
        const records = dto.performance
          .filter((p) => validExerciseIds.has(p.workoutExerciseId))
          .map((p) => ({
            userId: dto.userId,
            workoutSessionId: dto.sessionId,
            workoutExerciseId: p.workoutExerciseId,
            exerciseName: exerciseNamesById.get(p.workoutExerciseId) ?? "Unknown",
            targetReps: p.targetReps,
            actualReps: p.actualReps,
            difficulty: p.difficulty,
            completed: p.completed,
          }));

        if (records.length > 0) {
          await tx.exercisePerformanceRecord.createMany({ data: records });
        }
      }

      return updatedSession;
    });

    return {
      id: updated.id,
      startedAt: updated.startedAt.toISOString(),
      completedAt: updated.completedAt!.toISOString(),
    };
  }
}
