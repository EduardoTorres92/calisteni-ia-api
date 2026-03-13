import { NotFoundError } from "../errors/index.js";
import { adjustReps } from "../lib/adaptive-reps.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  workoutPlanId?: string;
}

interface UpdatedExerciseDto {
  workoutExerciseId: string;
  exerciseName: string;
  previousReps: number;
  newReps: number;
}

interface OutputDto {
  workoutPlanId: string;
  workoutPlanName: string;
  updated: UpdatedExerciseDto[];
}

export class ApplyAdaptiveRepsToPlan {
  async execute(dto: InputDto): Promise<OutputDto> {
    const plan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        ...(dto.workoutPlanId ? { id: dto.workoutPlanId } : { isActive: true }),
      },
      include: {
        workoutDays: {
          include: { workoutExercises: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!plan) {
      throw new NotFoundError("Nenhum plano de treino ativo encontrado");
    }

    const exerciseNames = [
      ...new Set(plan.workoutDays.flatMap((d) => d.workoutExercises.map((e) => e.name))),
    ];

    const lastRecords = await prisma.exercisePerformanceRecord.findMany({
      where: {
        userId: dto.userId,
        exerciseName: { in: exerciseNames },
      },
      orderBy: { createdAt: "desc" },
    });

    const lastByExerciseName = new Map(
      lastRecords.map((r) => [r.exerciseName, r] as const),
    );

    const updated: UpdatedExerciseDto[] = [];
    const updates: { id: string; reps: number }[] = [];

    for (const day of plan.workoutDays) {
      for (const ex of day.workoutExercises) {
        const record = lastByExerciseName.get(ex.name);
        const currentReps = ex.reps;
        const newReps = record
          ? adjustReps({
              target: record.targetReps,
              actual: record.actualReps,
              difficulty: record.difficulty,
            })
          : currentReps;

        if (newReps !== currentReps) {
          updated.push({
            workoutExerciseId: ex.id,
            exerciseName: ex.name,
            previousReps: currentReps,
            newReps,
          });
          updates.push({ id: ex.id, reps: newReps });
        }
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map((u) =>
          prisma.workoutExercise.update({
            where: { id: u.id },
            data: { reps: u.reps },
          }),
        ),
      );
    }

    return {
      workoutPlanId: plan.id,
      workoutPlanName: plan.name,
      updated,
    };
  }
}
