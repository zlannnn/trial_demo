import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import {
  ADMIN_CREDENTIALS,
  ADMIN_USER_ID,
  authCallbacks,
  authPages,
  isGoogleAuthConfigured,
} from "./shared";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "admin" | "user";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "admin" | "user";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "user";
  }
}

/** 仅在配置了有效 Google OAuth 凭证时注册 */
export const googleProvider = isGoogleAuthConfigured()
  ? Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      // 允许将 Google 账号关联到已有同 email 用户（如 ensureDbUser 曾创建的孤儿账号）
      allowDangerousEmailAccountLinking: true,
    })
  : null;

export const credentialsProvider = Credentials({
  id: "admin-credentials",
  name: "Admin",
  credentials: {
    username: { label: "账号", type: "text" },
    password: { label: "密码", type: "password" },
  },
  authorize(credentials) {
    if (
      credentials?.username === ADMIN_CREDENTIALS.username &&
      credentials?.password === ADMIN_CREDENTIALS.password
    ) {
      return {
        id: ADMIN_USER_ID,
        name: "Administrator",
        email: "admin@local",
        role: "admin" as const,
      };
    }
    return null;
  },
});

export const authConfig = {
  providers: [
    ...(googleProvider ? [googleProvider] : []),
    credentialsProvider,
  ],
  pages: authPages,
  callbacks: authCallbacks,
  session: {
    strategy: "jwt",
  },
  trustHost: true,
} satisfies NextAuthConfig;

export { ADMIN_USER_ID, ADMIN_CREDENTIALS } from "./shared";
