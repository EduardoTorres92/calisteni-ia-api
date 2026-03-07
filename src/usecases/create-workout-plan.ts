import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";
interface Dto {
  userId: string;
  name: string;
  workoutDays: Array<{
    name: string;
    weekDay: WeekDay;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    exercises: Array<{
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

export class CreateWorkoutPlan {
  async execute(dto: Dto) {
    const existingWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        isActive: true,
      },
    });
    return prisma.$transaction(async (tx) => {
      if (existingWorkoutPlan) {
        await tx.workoutPlan.update({
          where: { id: existingWorkoutPlan.id },
          data: { isActive: false },
        });
      }
      const created = await tx.workoutPlan.create({
        data: {
          name: dto.name,
          userId: dto.userId,
          isActive: true,
          workoutDays: {
            create: dto.workoutDays.map((workoutDay) => ({
              name: workoutDay.name,
              weekDay: workoutDay.weekDay,
              isRest: workoutDay.isRest,
              estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
              exercises: {
                create: workoutDay.exercises.map((exercise) => ({
                  name: exercise.name,
                  order: exercise.order,
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
        workoutDays: workoutPlan.workoutDays.map((day) => ({
          name: day.name,
          weekDay: day.weekDay,
          isRest: day.isRest,
          estimatedDurationInSeconds: day.estimatedDurationInSeconds,
          exercises: day.workoutExercises
            .sort((a, b) => a.order - b.order)
            .map((ex) => ({
              order: ex.order,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              restTimeInSeconds: ex.restTimeInSeconds,
            })),
        })),
      };
    });
  }
}

export default new CreateWorkoutPlan();
