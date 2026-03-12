import {
  ConflictError,
  NotFoundError,
  WorkoutPlanNotActiveError,
} from "../errors/index.js";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
}

interface OutputDto {
  userWorkoutSessionId: string;
}

export class StartWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
    });

    if (!workoutPlan) {
      throw new NotFoundError("Workout plan not found");
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new NotFoundError("Workout plan not found");
    }

    if (!workoutPlan.isActive) {
      throw new WorkoutPlanNotActiveError();
    }

    const workoutDay = await prisma.workoutDay.findUnique({
      where: { id: dto.workoutDayId, workoutPlanId: dto.workoutPlanId },
      include: { workoutExercises: { orderBy: { order: "asc" } } },
    });

    if (!workoutDay) {
      throw new NotFoundError("Workout day not found");
    }

    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        workoutDayId: dto.workoutDayId,
        startedAt: { not: undefined },
      },
    });

    if (existingSession) {
      throw new ConflictError("Workout session already started for this day");
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const session = await tx.workoutSession.create({
        data: {
          workoutDayId: dto.workoutDayId,
          startedAt: new Date(),
        },
      });

      const setRecords = workoutDay.workoutExercises.flatMap(
        (exercise: (typeof workoutDay)["workoutExercises"][number]) =>
          Array.from({ length: exercise.sets }, (_, i) => ({
            sessionId: session.id,
            exerciseId: exercise.id,
            setNumber: i + 1,
          })),
      );

      if (setRecords.length > 0) {
        await tx.workoutSet.createMany({ data: setRecords });
      }

      return { userWorkoutSessionId: session.id };
    });
  }
}
