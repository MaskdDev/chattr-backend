import { betterAuth } from "better-auth";
import { database } from "./database.ts";
import { username } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import generator from "./snowflake.ts";

export const auth = betterAuth({
  database,
  trustedOrigins: ["http://localhost:3001", "https://chattr.maskd.dev"],
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  account: {
    modelName: "accounts",
    accountLinking: {
      trustedProviders: ["google", "github"],
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 20,
    }),
    passkey(),
  ],
  user: {
    modelName: "users",
  },
  session: {
    modelName: "sessions",
  },
  verification: {
    modelName: "verifications",
  },
  advanced: {
    database: {
      generateId: () => generator.generate().toString(),
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
