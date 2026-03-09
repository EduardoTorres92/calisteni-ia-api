import { vi } from "vitest";
import { type DeepMockProxy, mockDeep } from "vitest-mock-extended";

import type { PrismaClient } from "../generated/prisma/client.js";

export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

vi.mock("../lib/db.js", () => ({
  prisma: prismaMock,
}));
