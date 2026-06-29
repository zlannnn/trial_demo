import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import { getAuthSecretFromEnv } from "./shared";
import { authConfig } from "./config";
import { db } from "~/server/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: getAuthSecretFromEnv(),
  adapter: PrismaAdapter(db),
});
