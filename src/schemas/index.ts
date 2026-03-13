import { z } from "zod";

import { ExercisePhase, WeekDay } from "../generated/prisma/enums.js";

const youtubeUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const u = new URL(url);
        if (u.hostname === "youtu.be") return u.pathname.length > 1;
        if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com")
          return u.searchParams.has("v");
        return false;
      } catch {
        return false;
      }
    },
    { message: "Must be a YouTube URL (youtube.com/watch?v= or youtu.be/)" },
  );

export const HomeResponseSchema = z.object({
  activeWorkoutPlanId: z.uuid(),
  todayWorkoutDay: z
    .object({
      workoutPlanId: z.uuid(),
      id: z.uuid(),
      name: z.string(),
      isRest: z.boolean(),
      weekDay: z.enum(WeekDay),
      estimatedDurationInSeconds: z.number(),
      coverImageUrl: z.string().url().nullable(),
      exercisesCount: z.number(),
    })
    .optional(),
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.string(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
  completedWorkoutsCount: z.number(),
  consistencyPercent: z.number(),
});

export const StatsResponseSchema = z.object({
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.string(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
  completedWorkoutsCount: z.number(),
  conclusionRate: z.number(),
  totalTimeInSeconds: z.number(),
});

export const UserTrainDataSchema = z.object({
  userId: z.string(),
  weightInGrams: z.number().min(0),
  heightInCentimeters: z.number().min(0),
  age: z.number().min(0),
  bodyFatPercentage: z.number().min(0).max(1),
});

export const UserTrainDataResponseSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  weightInGrams: z.number(),
  heightInCentimeters: z.number(),
  age: z.number(),
  bodyFatPercentage: z.number(),
});

export const ExerciseProgressionItemSchema = z.object({
  exerciseName: z.string(),
  previousTargetReps: z.number().int().nullable(),
  previousActualReps: z.number().int().nullable(),
  previousDate: z.string().nullable(),
  lastTargetReps: z.number().int(),
  lastActualReps: z.number().int(),
  lastDate: z.string(),
  suggestedReps: z.number().int(),
  delta: z.number().int(),
});

export const ProgressionResponseSchema = z.object({
  progressions: z.array(ExerciseProgressionItemSchema),
});

export const PerformanceHistoryDataPointSchema = z.object({
  date: z.string(),
  exerciseName: z.string(),
  targetReps: z.number().int(),
  actualReps: z.number().int(),
  difficulty: z.number().int(),
  completed: z.boolean(),
});

export const PerformanceHistoryResponseSchema = z.object({
  history: z.array(PerformanceHistoryDataPointSchema),
});

export const ErrorSchema = z.object({
  error: z.string().trim().min(1),
  code: z.string().trim().min(1),
});

export const WorkoutSessionResponseSchema = z.object({
  userWorkoutSessionId: z.uuid(),
});

export const ExercisePerformanceItemSchema = z.object({
  workoutExerciseId: z.uuid(),
  targetReps: z.number().int().min(1),
  actualReps: z.number().int().min(0),
  difficulty: z.number().int().min(1).max(10),
  completed: z.boolean(),
});

export const UpdateWorkoutSessionBodySchema = z.object({
  completedAt: z.iso.datetime(),
  performance: z.array(ExercisePerformanceItemSchema).optional(),
});

export const UpdateWorkoutSessionResponseSchema = z.object({
  id: z.uuid(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
});

export const WorkoutSetSchema = z.object({
  id: z.uuid(),
  exerciseId: z.uuid(),
  setNumber: z.number(),
  reps: z.number().nullable(),
  holdTimeInSeconds: z.number().nullable(),
  completed: z.boolean(),
  completedAt: z.iso.datetime().nullable(),
});

export const ToggleWorkoutSetResponseSchema = z.object({
  id: z.uuid(),
  setNumber: z.number(),
  completed: z.boolean(),
  completedAt: z.iso.datetime().nullable(),
});

export const GetWorkoutDayResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  isRest: z.boolean(),
  coverImageUrl: z.string().url().nullable(),
  estimatedDurationInSeconds: z.number(),
  targetMuscleGroups: z.array(z.string()),
  exercises: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      order: z.number(),
      workoutDayId: z.uuid(),
      phase: z.enum(ExercisePhase),
      sets: z.number(),
      reps: z.number(),
      restTimeInSeconds: z.number(),
      demonstrationVideoUrl: youtubeUrlSchema.nullable(),
    }),
  ),
  weekDay: z.enum(WeekDay),
  sessions: z.array(
    z.object({
      id: z.uuid(),
      workoutDayId: z.uuid(),
      startedAt: z.iso.date(),
      completedAt: z.iso.date().nullable(),
      workoutSets: z.array(WorkoutSetSchema).optional(),
    }),
  ),
});

export const ListWorkoutPlansResponseSchema = z.array(
  z.object({
    id: z.uuid(),
    name: z.string(),
    isActive: z.boolean(),
    workoutDays: z.array(
      z.object({
        id: z.uuid(),
        name: z.string(),
        weekDay: z.enum(WeekDay),
        isRest: z.boolean(),
        coverImageUrl: z.string().url().nullable(),
        estimatedDurationInSeconds: z.number(),
        exercises: z.array(
          z.object({
            id: z.uuid(),
            name: z.string(),
            order: z.number(),
            workoutDayId: z.uuid(),
            phase: z.enum(ExercisePhase),
            sets: z.number(),
            reps: z.number(),
            restTimeInSeconds: z.number(),
            demonstrationVideoUrl: youtubeUrlSchema.nullable(),
          }),
        ),
      }),
    ),
  }),
);

export const GetWorkoutPlanResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  workoutDays: z.array(
    z.object({
      id: z.uuid(),
      weekDay: z.enum(WeekDay),
      name: z.string(),
      isRest: z.boolean(),
      coverImageUrl: z.string().url().nullable(),
      estimatedDurationInSeconds: z.number(),
      exercisesCount: z.number(),
    }),
  ),
});

export const WorkoutPlanSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
  workoutDays: z.array(
    z.object({
      name: z.string().trim().min(1),
      weekDay: z.enum(WeekDay),
      isRest: z.boolean().default(false),
      estimatedDurationInSeconds: z.number().min(0),
      coverImageUrl: z.string().url().nullable(),
      exercises: z.array(
        z.object({
          order: z.number().min(0),
          name: z.string().trim().min(1),
          phase: z.enum(ExercisePhase).default("WORKOUT"),
          sets: z.number().min(1),
          reps: z.number().min(1),
          restTimeInSeconds: z.number().min(0),
          demonstrationVideoUrl: youtubeUrlSchema.nullable().optional(),
        }),
      ),
    }),
  ),
});
