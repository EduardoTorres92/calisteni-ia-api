import "dotenv/config";

import { createRequire } from "node:module";

import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";

import { prisma } from "./lib/db.js";

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};

import { auth } from "./lib/auth.js";
import { env } from "./lib/env.js";
import { aiRoutes } from "./routes/ai.js";
import { homeRoutes } from "./routes/home.js";
import { meRoutes } from "./routes/me.js";
import { statsRoutes } from "./routes/stats.js";
import { workoutPlanRoutes } from "./routes/workoutplan.js";
import { workoutSessionRoutes } from "./routes/workout-sessions.js";

const app = Fastify({
  logger: envToLogger[env.NODE_ENV],
  ajv: {
    customOptions: {
      allErrors: true,
    },
  },
});

app.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (req, body, done) => {
    try {
      const str = (body as string).trim();
      done(null, str.length > 0 ? JSON.parse(str) : undefined);
    } catch (err) {
      done(err as Error, undefined);
    }
  },
);

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Calisteni.IA API",
      description:
        "API REST para gerenciamento de treinos de calistenia com IA personal trainer, tracking por serie e catalogo de exercicios.",
      version: "1.0.0",
    },
    servers: [
      {
        description: "API Base URL",
        url: env.API_BASE_URL,
      },
    ],
  },
  transform: jsonSchemaTransform,
});

await app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    filter: true,
    tryItOutEnabled: true,
  },
});

app.register(fastifyCors, {
  origin: [env.WEB_APP_BASE_URL],
  credentials: true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(workoutPlanRoutes, { prefix: "/workout-plans" });
await app.register(homeRoutes, { prefix: "/home" });
await app.register(statsRoutes, { prefix: "/stats" });
await app.register(meRoutes, { prefix: "/me" });
await app.register(workoutSessionRoutes, { prefix: "/workout-sessions" });
await app.register(aiRoutes, { prefix: "/ai" });

app.get("/swagger.json", async (request, reply) => {
  return reply.send(app.swagger());
});

const pkg = createRequire(import.meta.url)("../package.json") as {
  name: string;
  version: string;
};

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/health",
  schema: {
    description: "Health check and service status (database connectivity)",
    tags: ["Health"],
    response: {
      200: z.object({
        status: z.enum(["ok", "degraded"]),
        service: z.string(),
        version: z.string(),
        uptime: z.number(),
        timestamp: z.string().datetime(),
        database: z.enum(["connected", "error"]),
      }),
    },
  },
  handler: async () => {
    let database: "connected" | "error";
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "connected";
    } catch {
      database = "error";
    }
    return {
      status: (database === "connected" ? "ok" : "degraded") as "ok" | "degraded",
      service: pkg.name,
      version: pkg.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database,
    };
  },
});

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/",
  schema: {
    description: "API info and links",
    tags: ["Health"],
    response: {
      200: z.object({
        name: z.string(),
        version: z.string(),
        status: z.string(),
        docs_url: z.string(),
        swagger_url: z.string(),
        uptime_seconds: z.number(),
      }),
    },
  },
  handler: () => {
    return {
      name: "Calisteni.IA API",
      version: pkg.version,
      status: "healthy",
      docs_url: `${env.API_BASE_URL}/docs`,
      swagger_url: `${env.API_BASE_URL}/swagger.json`,
      uptime_seconds: Math.floor(process.uptime()),
    };
  },
});

app.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  schema: {
    hide: true,
  },
  async handler(request, reply) {
    try {
      // Construct request URL
      const url = new URL(request.url, `http://${request.headers.host}`);

      // Convert Fastify headers to standard Headers object
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString());
      });
      // Create Fetch API-compatible request
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });
      // Process authentication request
      const response = await auth.handler(req);
      // Forward response to client
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      reply.send(response.body ? await response.text() : null);
    } catch (error) {
      app.log.error(error);
      reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});

try {
  await app.listen({
    port: env.PORT,
    host: "0.0.0.0",
  });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
