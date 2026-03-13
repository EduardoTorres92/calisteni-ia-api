import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

import { BadRequestError, NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  sessionId: string;
}

interface OutputDto {
  feedback: string;
}

const COACH_SYSTEM_PROMPT = `You are a professional calisthenics coach.
Analyze the user's performance and provide short coaching feedback.
Give constructive coaching advice in 2 sentences.
Prioritize recommendations about: progression, maintenance, volume reduction, recovery.
Avoid generic answers.`;

export class GenerateCoachFeedback {
  async execute(dto: InputDto): Promise<OutputDto> {
    const session = await prisma.workoutSession.findUnique({
      where: { id: dto.sessionId },
      include: {
        workoutDay: {
          include: {
            workoutPlan: { select: { userId: true } },
          },
        },
        exercisePerformanceRecords: true,
      },
    });

    if (!session) {
      throw new NotFoundError("Workout session not found");
    }

    if (session.workoutDay.workoutPlan.userId !== dto.userId) {
      throw new NotFoundError("Workout session not found");
    }

    if (!session.completedAt) {
      throw new BadRequestError("Session not completed. Finish the workout first.");
    }

    const lines = session.exercisePerformanceRecords.map(
      (r) =>
        `${r.exerciseName}\ntarget: ${r.targetReps}\nactual: ${r.actualReps}\ndifficulty: ${r.difficulty}`,
    );

    const userPerformanceBlock =
      lines.length > 0
        ? `User performance this session:\n\n${lines.join("\n\n")}`
        : "User completed the session but no exercise performance data was recorded.";

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: COACH_SYSTEM_PROMPT,
      prompt: userPerformanceBlock,
    });

    const feedback = text.trim();
    if (!feedback) {
      return {
        feedback: "Great session! Keep the consistency and progress gradually.",
      };
    }

    return { feedback };
  }
}
