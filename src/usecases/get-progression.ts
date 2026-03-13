import dayjs from "dayjs";

import { adjustReps } from "../lib/adaptive-reps.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
}

interface ExerciseProgressionDto {
  exerciseName: string;
  previousTargetReps: number | null;
  previousActualReps: number | null;
  previousDate: string | null;
  lastTargetReps: number;
  lastActualReps: number;
  lastDate: string;
  suggestedReps: number;
  delta: number;
}

interface OutputDto {
  progressions: ExerciseProgressionDto[];
}

export class GetProgression {
  async execute(dto: InputDto): Promise<OutputDto> {
    const records = await prisma.exercisePerformanceRecord.findMany({
      where: { userId: dto.userId },
      orderBy: { createdAt: "desc" },
    });

    const byExercise = new Map<string, typeof records>();
    for (const r of records) {
      if (!byExercise.has(r.exerciseName)) {
        byExercise.set(r.exerciseName, []);
      }
      byExercise.get(r.exerciseName)!.push(r);
    }

    const progressions: ExerciseProgressionDto[] = [];

    for (const [exerciseName, list] of byExercise) {
      const last = list[0];
      const previous = list[1] ?? null;

      const suggestedReps = adjustReps({
        target: last.targetReps,
        actual: last.actualReps,
        difficulty: last.difficulty,
      });

      progressions.push({
        exerciseName,
        previousTargetReps: previous?.targetReps ?? null,
        previousActualReps: previous?.actualReps ?? null,
        previousDate: previous
          ? dayjs(previous.createdAt).format("YYYY-MM-DD")
          : null,
        lastTargetReps: last.targetReps,
        lastActualReps: last.actualReps,
        lastDate: dayjs(last.createdAt).format("YYYY-MM-DD"),
        suggestedReps,
        delta: suggestedReps - last.targetReps,
      });
    }

    progressions.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

    return { progressions };
  }
}
