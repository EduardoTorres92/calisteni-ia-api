import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";

import { prisma } from "./db.js";
import { env } from "./env.js";

const isProduction = env.NODE_ENV === "production";

export const auth = betterAuth({
  baseURL: env.WEB_APP_BASE_URL,
  trustedOrigins: [env.WEB_APP_BASE_URL, env.API_BASE_URL],
  advanced: {
    defaultCookieAttributes: {
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      ...(isProduction && { partitioned: true }),
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [openAPI()],
});
