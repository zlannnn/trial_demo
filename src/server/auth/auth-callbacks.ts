import type { NextAuthConfig } from "next-auth";

import { resolveDbUserIdForAuthUser } from "./ensure-db-user";

/** 服务端 Auth 回调（含 DB 查询，不可用于 Edge Middleware） */
export const authCallbacks = {
  async jwt({ token, user }) {
    if (user) {
      const dbUserId = await resolveDbUserIdForAuthUser(user);
      if (dbUserId) {
        token.id = dbUserId;
      } else if (user.id) {
        token.id = user.id;
      }
    }
    if (user?.role) {
      token.role = user.role;
    } else if (!token.role) {
      token.role = "user";
    }
    return token;
  },
  session({ session, token }) {
    return {
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
        role: (token.role as "admin" | "user") ?? "user",
      },
    };
  },
  redirect({ url, baseUrl }) {
    if (url.startsWith("/")) return `${baseUrl}${url}`;
    if (url.startsWith(baseUrl)) return url;
    return `${baseUrl}/chat`;
  },
} satisfies NextAuthConfig["callbacks"];
