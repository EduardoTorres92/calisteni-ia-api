import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
  sessionId: string;
  setId: string;
}

interface OutputDto {
  id: string;
  setNumber: number;
  completed: boolean;
  completedAt: string | null;
}

export class ToggleWorkoutSet {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
    });

    if (!workoutPlan || workoutPlan.userId !== dto.userId) {
      throw new NotFoundError("Workout plan not found");
    }

    const workoutDay = await prisma.workoutDay.findUnique({
      where: { id: dto.workoutDayId, workoutPlanId: dto.workoutPlanId },
    });

    if (!workoutDay) {
      throw new NotFoundError("Workout day not found");
    }

    const session = await prisma.workoutSession.findUnique({
      where: { id: dto.sessionId, workoutDayId: dto.workoutDayId },
    });

    if (!session) {
      throw new NotFoundError("Workout session not found");
    }

    const workoutSet = await prisma.workoutSet.findUnique({
      where: { id: dto.setId, sessionId: dto.sessionId },
    });

    if (!workoutSet) {
      throw new NotFoundError("Workout set not found");
    }

    const newCompleted = !workoutSet.completed;

    const updated = await prisma.workoutSet.update({
      where: { id: dto.setId },
      data: {
        completed: newCompleted,
        completedAt: newCompleted ? new Date() : null,
      },
    });

    return {
      id: updated.id,
      setNumber: updated.setNumber,
      completed: updated.completed,
      completedAt: updated.completedAt?.toISOString() ?? null,
    };
  }
}
