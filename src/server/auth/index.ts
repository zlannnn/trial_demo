import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import { getAuthSecret } from "~/env";
import { authConfig, googleProvider } from "./config";
import { db } from "~/server/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [googleProvider],
  secret: getAuthSecret(),
  adapter: PrismaAdapter(db),
});
