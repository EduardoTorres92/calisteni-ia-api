import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { BadRequestError, NotFoundError } from "../errors/index.js";
import { auth } from "../lib/auth.js";
import { CoachFeedbackResponseSchema, ErrorSchema } from "../schemas/index.js";
import { GenerateCoachFeedback } from "../usecases/generate-coach-feedback.js";

export const workoutSessionRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/:id/coach-feedback",
    schema: {
      operationId: "generateCoachFeedback",
      tags: ["Workout Session"],
      summary: "Gera feedback de coaching por IA após conclusão do treino",
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        200: CoachFeedbackResponseSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        });
        if (!session) {
          return reply.status(401).send({
            error: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }

        const result = await new GenerateCoachFeedback().execute({
          userId: session.user.id,
          sessionId: request.params.id,
        });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);
        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND",
          });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({
            error: error.message,
            code: "BAD_REQUEST",
          });
        }
        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });
};
