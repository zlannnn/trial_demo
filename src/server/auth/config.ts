import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { env } from "~/env";

export const ADMIN_USER_ID = "admin-system";
export const ADMIN_CREDENTIALS = { username: "admin", password: "admin" };

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

/** 始终注册 Google provider，避免 OAuth 回调时 providers 为空 */
export const googleProvider = Google({
  clientId: env.AUTH_GOOGLE_ID ?? "",
  clientSecret: env.AUTH_GOOGLE_SECRET ?? "",
});

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
  providers: [googleProvider, credentialsProvider],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
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
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
} satisfies NextAuthConfig;
