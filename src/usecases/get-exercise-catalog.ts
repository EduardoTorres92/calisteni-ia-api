import {
  ExerciseCategory,
  ExerciseLevel,
} from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  category?: ExerciseCategory;
  level?: ExerciseLevel;
  equipment?: string[];
}

interface ExerciseDto {
  id: string;
  name: string;
  category: ExerciseCategory;
  level: ExerciseLevel;
  muscleGroups: string[];
  equipment: string[];
  isIsometric: boolean;
}

export class GetExerciseCatalog {
  async execute(dto: InputDto): Promise<ExerciseDto[]> {
    const where: Record<string, unknown> = {};

    if (dto.category) {
      where.category = dto.category;
    }

    if (dto.level) {
      where.level = dto.level;
    }

    if (dto.equipment && dto.equipment.length > 0) {
      where.equipment = { hasSome: dto.equipment };
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: [{ category: "asc" }, { level: "asc" }, { name: "asc" }],
    });

    return exercises.map(
      (ex: (typeof exercises)[number]): ExerciseDto => ({
        id: ex.id,
        name: ex.name,
        category: ex.category,
        level: ex.level,
        muscleGroups: ex.muscleGroups,
        equipment: ex.equipment,
        isIsometric: ex.isIsometric,
      }),
    );
  }
}
