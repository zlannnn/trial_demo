import NextAuth from "next-auth";

import { edgeAuthCallbacks } from "~/server/auth/edge-auth-callbacks";
import { authPages, getAuthSecretFromEnv } from "~/server/auth/shared";

export default NextAuth({
  providers: [],
  secret: getAuthSecretFromEnv(),
  callbacks: {
    ...edgeAuthCallbacks,
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role ?? "user";
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/admin/login")) {
        if (isLoggedIn && role === "admin") {
          return Response.redirect(new URL("/admin", request.nextUrl));
        }
        return true;
      }

      if (pathname.startsWith("/admin")) {
        return isLoggedIn && role === "admin";
      }

      if (pathname.startsWith("/login")) {
        if (isLoggedIn) {
          if (role === "admin") {
            return Response.redirect(new URL("/admin", request.nextUrl));
          }
          return Response.redirect(new URL("/chat", request.nextUrl));
        }
        return true;
      }

      if (pathname.startsWith("/chat")) {
        if (!isLoggedIn) return false;
        if (role === "admin") {
          return Response.redirect(new URL("/admin", request.nextUrl));
        }
        return true;
      }

      if (pathname.startsWith("/api/trpc")) {
        return isLoggedIn;
      }

      return true;
    },
  },
  pages: authPages,
  session: {
    strategy: "jwt",
  },
  trustHost: true,
}).auth;

export const config = {
  matcher: [
    "/chat",
    "/chat/:path*",
    "/login",
    "/admin",
    "/admin/:path*",
    "/api/trpc/:path*",
  ],
};
