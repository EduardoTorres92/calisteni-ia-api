import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { NotFoundError } from "../errors/index.js";
import { WeekDay, ExercisePhase } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

dayjs.extend(utc);

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
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

interface WorkoutSetDto {
  id: string;
  exerciseId: string;
  setNumber: number;
  reps: number | null;
  holdTimeInSeconds: number | null;
  completed: boolean;
  completedAt: string | null;
}

interface SessionDto {
  id: string;
  workoutDayId: string;
  startedAt: string;
  completedAt: string | null;
  workoutSets?: WorkoutSetDto[];
}

interface OutputDto {
  id: string;
  name: string;
  isRest: boolean;
  coverImageUrl: string | null;
  estimatedDurationInSeconds: number;
  exercises: ExerciseDto[];
  weekDay: WeekDay;
  sessions: SessionDto[];
  targetMuscleGroups: string[];
}

export class GetWorkoutDay {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
    });

    if (!workoutPlan || workoutPlan.userId !== dto.userId) {
      throw new NotFoundError("Workout plan not found");
    }

    const workoutDay = await prisma.workoutDay.findUnique({
      where: { id: dto.workoutDayId, workoutPlanId: dto.workoutPlanId },
      include: {
        workoutExercises: { orderBy: { order: "asc" } },
        workoutSessions: {
          include: {
            workoutSets: { orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }] },
          },
        },
      },
    });

    if (!workoutDay) {
      throw new NotFoundError("Workout day not found");
    }

    const exerciseNames = workoutDay.workoutExercises.map(
      (e: (typeof workoutDay)["workoutExercises"][number]) => e.name,
    );

    const catalogExercises = exerciseNames.length > 0
      ? await prisma.exercise.findMany({
          where: { name: { in: exerciseNames } },
          select: { muscleGroups: true },
        })
      : [];

    const targetMuscleGroups = [
      ...new Set(catalogExercises.flatMap((e: { muscleGroups: string[] }) => e.muscleGroups)),
    ];

    return {
      id: workoutDay.id,
      name: workoutDay.name,
      isRest: workoutDay.isRest,
      coverImageUrl: workoutDay.coverImageUrl ?? null,
      estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
      weekDay: workoutDay.weekDay,
      targetMuscleGroups,
      exercises: workoutDay.workoutExercises.map(
        (exercise: (typeof workoutDay)["workoutExercises"][number]) => ({
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
      sessions: workoutDay.workoutSessions.map(
        (session: (typeof workoutDay)["workoutSessions"][number]) => ({
        id: session.id,
        workoutDayId: session.workoutDayId,
        startedAt: dayjs.utc(session.startedAt).format("YYYY-MM-DD"),
        completedAt: session.completedAt
          ? dayjs.utc(session.completedAt).format("YYYY-MM-DD")
          : null,
        workoutSets: session.workoutSets.map(
          (ws: (typeof session)["workoutSets"][number]) => ({
            id: ws.id,
            exerciseId: ws.exerciseId,
            setNumber: ws.setNumber,
            reps: ws.reps,
            holdTimeInSeconds: ws.holdTimeInSeconds,
            completed: ws.completed,
            completedAt: ws.completedAt?.toISOString() ?? null,
          }),
        ),
      })),
    };
  }
}
