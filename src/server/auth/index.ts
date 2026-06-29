import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import { getAuthSecretFromEnv } from "./shared";
import { authConfig } from "./config";
import { db } from "~/server/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: getAuthSecretFromEnv(),
  adapter: PrismaAdapter(db),
  events: {
    async signIn({ user }) {
      if (!user.email) return;

      await db.user.upsert({
        where: { email: user.email },
        create: {
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        },
        update: {
          name: user.name ?? null,
          image: user.image ?? null,
        },
      });
    },
  },
});
