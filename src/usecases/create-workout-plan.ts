import { NotFoundError } from "../errors/index.js";
import { Prisma } from "../generated/prisma/client.js";
import { WeekDay, ExercisePhase } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  name: string;
  workoutDays: Array<{
    name: string;
    weekDay: WeekDay;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string | null;
    exercises: Array<{
      order: number;
      name: string;
      phase?: ExercisePhase;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

interface OutputDto {
  id: string;
  name: string;
  workoutDays: Array<{
    name: string;
    weekDay: WeekDay;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    coverImageUrl: string | null;
    exercises: Array<{
      order: number;
      name: string;
      phase: ExercisePhase;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

export class CreateWorkoutPlan {
  async execute(dto: InputDto): Promise<OutputDto> {
    const existingWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        isActive: true,
      },
    });
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (existingWorkoutPlan) {
        await tx.workoutPlan.update({
          where: { id: existingWorkoutPlan.id },
          data: { isActive: false },
        });
      }
      const created = await tx.workoutPlan.create({
        data: {
          id: crypto.randomUUID(),
          name: dto.name,
          userId: dto.userId,
          isActive: true,
          workoutDays: {
            create: dto.workoutDays.map((workoutDay: InputDto["workoutDays"][number]) => ({
              name: workoutDay.name,
              weekDay: workoutDay.weekDay,
              isRest: workoutDay.isRest,
              estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
              coverImageUrl: workoutDay.coverImageUrl ?? null,
              workoutExercises: {
                create: workoutDay.exercises.map((exercise: InputDto["workoutDays"][number]["exercises"][number]) => ({
                  name: exercise.name,
                  order: exercise.order,
                  phase: exercise.phase ?? "WORKOUT",
                  sets: exercise.sets,
                  reps: exercise.reps,
                  restTimeInSeconds: exercise.restTimeInSeconds,
                })),
              },
            })),
          },
        },
      });
      const workoutPlan = await tx.workoutPlan.findUnique({
        where: { id: created.id },
        include: {
          workoutDays: {
            include: {
              workoutExercises: true,
            },
          },
        },
      });
      if (!workoutPlan) {
        throw new NotFoundError("Workout plan not found");
      }
      return {
        id: workoutPlan.id,
        name: workoutPlan.name,
        workoutDays: workoutPlan.workoutDays.map((day: (typeof workoutPlan)["workoutDays"][number]) => ({
          name: day.name,
          weekDay: day.weekDay,
          isRest: day.isRest,
          estimatedDurationInSeconds: day.estimatedDurationInSeconds,
          coverImageUrl: day.coverImageUrl,
          exercises: day.workoutExercises
            .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
            .map((ex: (typeof day)["workoutExercises"][number]) => ({
              order: ex.order,
              name: ex.name,
              phase: ex.phase,
              sets: ex.sets,
              reps: ex.reps,
              restTimeInSeconds: ex.restTimeInSeconds,
            })),
        })),
      };
    });
  }
}
