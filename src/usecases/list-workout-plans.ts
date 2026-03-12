import { WeekDay, ExercisePhase } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  active?: boolean;
}

interface ExerciseDto {
  id: string;
  name: string;
  order: number;
  workoutDayId: string;
  phase: ExercisePhase;
  sets: number;
  reps: number;
  restTimeInSeconds: number;
  demonstrationVideoUrl: string | null;
}

interface WorkoutDayDto {
  id: string;
  name: string;
  weekDay: WeekDay;
  isRest: boolean;
  coverImageUrl: string | null;
  estimatedDurationInSeconds: number;
  exercises: ExerciseDto[];
}

interface WorkoutPlanDto {
  id: string;
  name: string;
  isActive: boolean;
  workoutDays: WorkoutDayDto[];
}

type OutputDto = WorkoutPlanDto[];

export class ListWorkoutPlans {
  async execute(dto: InputDto): Promise<OutputDto> {
    const where: { userId: string; isActive?: boolean } = {
      userId: dto.userId,
    };

    if (dto.active !== undefined) {
      where.isActive = dto.active;
    }

    const workoutPlans = await prisma.workoutPlan.findMany({
      where,
      include: {
        workoutDays: {
          include: {
            workoutExercises: { orderBy: { order: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return workoutPlans.map((plan: (typeof workoutPlans)[number]) => ({
      id: plan.id,
      name: plan.name,
      isActive: plan.isActive,
      workoutDays: plan.workoutDays.map(
        (day: (typeof plan)["workoutDays"][number]) => ({
        id: day.id,
        name: day.name,
        weekDay: day.weekDay,
        isRest: day.isRest,
        coverImageUrl: day.coverImageUrl ?? null,
        estimatedDurationInSeconds: day.estimatedDurationInSeconds,
        exercises: day.workoutExercises.map(
          (exercise: (typeof day)["workoutExercises"][number]) => ({
          id: exercise.id,
          name: exercise.name,
          order: exercise.order,
          workoutDayId: exercise.workoutDayId,
          phase: exercise.phase,
          sets: exercise.sets,
          reps: exercise.reps,
          restTimeInSeconds: exercise.restTimeInSeconds,
          demonstrationVideoUrl: exercise.demonstrationVideoUrl ?? null,
        })),
      })),
    }));
  }
}
