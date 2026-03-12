import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

dayjs.extend(utc);

const DAY_INDEX_TO_WEEK_DAY: Record<number, WeekDay> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

interface InputDto {
  userId: string;
  date: string;
}

interface TodayWorkoutDay {
  workoutPlanId: string;
  id: string;
  name: string;
  isRest: boolean;
  weekDay: WeekDay;
  estimatedDurationInSeconds: number;
  coverImageUrl: string | null;
  exercisesCount: number;
}

interface ConsistencyDay {
  workoutDayCompleted: boolean;
  workoutDayStarted: boolean;
}

interface OutputDto {
  activeWorkoutPlanId: string;
  todayWorkoutDay?: {
    workoutPlanId: string;
    id: string;
    name: string;
    isRest: boolean;
    weekDay: WeekDay;
    estimatedDurationInSeconds: number;
    coverImageUrl: string | null;
    exercisesCount: number;
  };
  workoutStreak: number;
  consistencyByDay: Record<string, ConsistencyDay>;
  completedWorkoutsCount: number;
  consistencyPercent: number;
}

export class GetHomeData {
  async execute(dto: InputDto): Promise<OutputDto> {
    const currentDate = dayjs.utc(dto.date);
    const currentWeekDay = DAY_INDEX_TO_WEEK_DAY[currentDate.day()];

    const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: { userId: dto.userId, isActive: true },
      include: {
        workoutDays: {
          include: {
            workoutExercises: true,
          },
        },
      },
    });


    if (!activeWorkoutPlan) {
      throw new NotFoundError("No active workout plan found");
    }

    const todayWorkoutDayRecord = activeWorkoutPlan.workoutDays.find(
      (day: (typeof activeWorkoutPlan)["workoutDays"][number]) =>
        day.weekDay === currentWeekDay,
    );

    const todayWorkoutDay: TodayWorkoutDay | undefined =
      todayWorkoutDayRecord
        ? {
            workoutPlanId: activeWorkoutPlan.id,
            id: todayWorkoutDayRecord.id,
            name: todayWorkoutDayRecord.name,
            isRest: todayWorkoutDayRecord.isRest,
            weekDay: todayWorkoutDayRecord.weekDay,
            estimatedDurationInSeconds:
              todayWorkoutDayRecord.estimatedDurationInSeconds,
            coverImageUrl: todayWorkoutDayRecord.coverImageUrl ?? null,
            exercisesCount: todayWorkoutDayRecord.workoutExercises.length,
          }
        : undefined;

    const sundayStart = currentDate.day(0).startOf("day").toDate();
    const saturdayEnd = currentDate.day(6).endOf("day").toDate();

    const workoutDayIds = activeWorkoutPlan.workoutDays.map(
      (d: (typeof activeWorkoutPlan)["workoutDays"][number]) => d.id,
    );

    const weekSessions = await prisma.workoutSession.findMany({
      where: {
        workoutDayId: { in: workoutDayIds },
        startedAt: {
          gte: sundayStart,
          lte: saturdayEnd,
        },
      },
    });

    const consistencyByDay = this.buildConsistencyByDay(
      currentDate,
      weekSessions,
    );

    const workoutStreak = await this.calculateStreak(
      activeWorkoutPlan.workoutDays,
      workoutDayIds,
      currentDate,
    );

    const allSessions = await prisma.workoutSession.findMany({
      where: { workoutDayId: { in: workoutDayIds } },
    });
    const completedWorkoutsCount = allSessions.filter(
      (s: { completedAt: Date | null }) => s.completedAt !== null,
    ).length;
    const consistencyPercent =
      allSessions.length > 0
        ? Math.round((completedWorkoutsCount / allSessions.length) * 100)
        : 0;

    return {
      activeWorkoutPlanId: activeWorkoutPlan.id,
      todayWorkoutDay,
      workoutStreak,
      consistencyByDay,
      completedWorkoutsCount,
      consistencyPercent,
    };
  }

  private buildConsistencyByDay(
    currentDate: dayjs.Dayjs,
    sessions: Array<{ startedAt: Date; completedAt: Date | null }>,
  ): Record<string, ConsistencyDay> {
    const consistencyByDay: Record<string, ConsistencyDay> = {};

    for (let i = 0; i <= 6; i++) {
      const day = currentDate.day(i);
      const dateKey = day.format("YYYY-MM-DD");
      consistencyByDay[dateKey] = {
        workoutDayCompleted: false,
        workoutDayStarted: false,
      };
    }

    for (const session of sessions) {
      const sessionDate = dayjs.utc(session.startedAt).format("YYYY-MM-DD");

      if (consistencyByDay[sessionDate]) {
        consistencyByDay[sessionDate].workoutDayStarted = true;

        if (session.completedAt) {
          consistencyByDay[sessionDate].workoutDayCompleted = true;
        }
      }
    }

    return consistencyByDay;
  }

  private async calculateStreak(
    workoutDays: Array<{ weekDay: WeekDay; isRest: boolean }>,
    workoutDayIds: string[],
    currentDate: dayjs.Dayjs,
  ): Promise<number> {
    const workoutDaysByWeekDay = new Map<
      WeekDay,
      { weekDay: WeekDay; isRest: boolean }
    >();
    for (const day of workoutDays) {
      workoutDaysByWeekDay.set(day.weekDay, day);
    }

    const lookbackStart = currentDate.subtract(90, "day").startOf("day").toDate();
    const lookbackEnd = currentDate.subtract(1, "day").endOf("day").toDate();

    const completedSessions = await prisma.workoutSession.findMany({
      where: {
        workoutDayId: { in: workoutDayIds },
        completedAt: { not: null },
        startedAt: {
          gte: lookbackStart,
          lte: lookbackEnd,
        },
      },
    });

    const completedDates = new Set(
      completedSessions.map(
        (s: { startedAt: Date }) =>
          dayjs.utc(s.startedAt).format("YYYY-MM-DD"),
      ),
    );

    let streak = 0;
    let checkDate = currentDate;
    const maxLookbackDays = 90;

    for (let i = 0; i < maxLookbackDays; i++) {
      const weekDay = DAY_INDEX_TO_WEEK_DAY[checkDate.day()];
      const workoutDay = workoutDaysByWeekDay.get(weekDay);

      if (!workoutDay) {
        checkDate = checkDate.subtract(1, "day");
        continue;
      }

      if (workoutDay.isRest) {
        streak++;
        checkDate = checkDate.subtract(1, "day");
        continue;
      }

      const dateKey = checkDate.format("YYYY-MM-DD");
      if (completedDates.has(dateKey)) {
        streak++;
        checkDate = checkDate.subtract(1, "day");
        continue;
      }

      break;
    }

    return streak;
  }
}
