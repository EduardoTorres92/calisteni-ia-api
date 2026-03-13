import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { NotFoundError } from "../errors/index.js";
import { auth } from "../lib/auth.js";
import {
  ApplyAdaptiveRepsResponseSchema,
  ErrorSchema,
  PerformanceHistoryResponseSchema,
  ProgressionResponseSchema,
  UserTrainDataResponseSchema,
  UserTrainDataSchema,
} from "../schemas/index.js";
import { ApplyAdaptiveRepsToPlan } from "../usecases/apply-adaptive-reps-to-plan.js";
import { GetPerformanceHistory } from "../usecases/get-performance-history.js";
import { GetProgression } from "../usecases/get-progression.js";
import { GetUserTrainData } from "../usecases/get-user-train-data.js";
import { UpsertUserTrainData } from "../usecases/upsert-user-train-data.js";

export const meRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      operationId: "getUserTrainData",
      tags: ["Me"],
      summary: "Get user train data",
      response: {
        200: UserTrainDataResponseSchema.nullable(),
        401: ErrorSchema,
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

        const result = await new GetUserTrainData().execute(session.user.id);

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/",
    schema: {
      operationId: "upsertUserTrainData",
      tags: ["Me"],
      summary: "Create or update user train data",
      body: UserTrainDataSchema.omit({ userId: true }),
      response: {
        200: UserTrainDataSchema,
        401: ErrorSchema,
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

        const result = await new UpsertUserTrainData().execute({
          userId: session.user.id,
          weightInGrams: request.body.weightInGrams,
          heightInCentimeters: request.body.heightInCentimeters,
          age: request.body.age,
          bodyFatPercentage: request.body.bodyFatPercentage,
        });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/progression",
    schema: {
      operationId: "getProgression",
      tags: ["Me"],
      summary: "Get exercise progression (adaptive reps suggestion)",
      response: {
        200: ProgressionResponseSchema,
        401: ErrorSchema,
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

        const result = await new GetProgression().execute({
          userId: session.user.id,
        });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/performance-history",
    schema: {
      operationId: "getPerformanceHistory",
      tags: ["Me"],
      summary: "Get performance history for charts",
      querystring: z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        exerciseName: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(200).optional(),
      }),
      response: {
        200: PerformanceHistoryResponseSchema,
        401: ErrorSchema,
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

        const result = await new GetPerformanceHistory().execute({
          userId: session.user.id,
          from: request.query.from,
          to: request.query.to,
          exerciseName: request.query.exerciseName,
          limit: request.query.limit,
        });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/apply-adaptive-reps",
    schema: {
      operationId: "applyAdaptiveRepsToPlan",
      tags: ["Me"],
      summary: "Atualiza as reps do plano ativo com base no desempenho da semana (igual ou acima da meta → sobe; abaixo → mantém ou reduz)",
      body: z.object({ workoutPlanId: z.uuid().optional() }).optional(),
      response: {
        200: ApplyAdaptiveRepsResponseSchema,
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

        const result = await new ApplyAdaptiveRepsToPlan().execute({
          userId: session.user.id,
          workoutPlanId: request.body?.workoutPlanId,
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
        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });
};
