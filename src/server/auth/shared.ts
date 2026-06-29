import type { NextAuthConfig } from "next-auth";

import { resolveDbUserIdForAuthUser } from "./ensure-db-user";

export const ADMIN_USER_ID = "admin-system";
export const ADMIN_CREDENTIALS = { username: "admin", password: "admin" };

export const authPages = {
  signIn: "/login",
} as const;

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

export function getAuthSecretFromEnv() {
  return (
    process.env.AUTH_SECRET ?? "dev-only-auth-secret-do-not-use-in-production"
  );
}

const GOOGLE_PLACEHOLDER_MARKERS = [
  "your-google-client-id",
  "your-google-client-secret",
  "xxx",
  "changeme",
];

function isPlaceholderSecret(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return GOOGLE_PLACEHOLDER_MARKERS.some((marker) =>
    normalized.includes(marker),
  );
}

export function isGoogleAuthConfigured() {
  const id = process.env.AUTH_GOOGLE_ID?.trim();
  const secret = process.env.AUTH_GOOGLE_SECRET?.trim();
  if (!id || !secret) return false;
  if (isPlaceholderSecret(id) || isPlaceholderSecret(secret)) return false;
  return true;
}
