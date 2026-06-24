import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import { getAuthSecret } from "~/env";
import {
  authConfig,
  credentialsProvider,
  googleProvider,
} from "./config";
import { db } from "~/server/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [googleProvider, credentialsProvider],
  secret: getAuthSecret(),
  adapter: PrismaAdapter(db),
});
