import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { vi } from "vitest";

import { homeRoutes } from "../routes/home.js";
import { meRoutes } from "../routes/me.js";
import { statsRoutes } from "../routes/stats.js";
import { workoutPlanRoutes } from "../routes/workoutplan.js";

vi.mock("../lib/auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: "test-user-id", name: "Test User" },
        session: { id: "test-session-id" },
      }),
    },
  },
}));

export const buildApp = async () => {
  const app = Fastify({ logger: false });

  await app.register(fastifySwagger, {
    openapi: {
      info: { title: "Test API", version: "1.0.0" },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(fastifyCors);

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(workoutPlanRoutes, { prefix: "/workout-plans" });
  await app.register(homeRoutes, { prefix: "/home" });
  await app.register(statsRoutes, { prefix: "/stats" });
  await app.register(meRoutes, { prefix: "/me" });

  await app.ready();
  return app;
};
