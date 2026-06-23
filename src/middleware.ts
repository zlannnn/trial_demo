import NextAuth from "next-auth";

import { getAuthSecret } from "~/env";
import { authConfig, googleProvider } from "~/server/auth/config";

export default NextAuth({
  ...authConfig,
  providers: [googleProvider],
  secret: getAuthSecret(),
  callbacks: {
    ...authConfig.callbacks,
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/login")) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/chat", request.nextUrl));
        }
        return true;
      }

      if (pathname.startsWith("/chat") || pathname.startsWith("/api/trpc")) {
        return isLoggedIn;
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
}).auth;

export const config = {
  matcher: ["/chat", "/chat/:path*", "/login", "/api/trpc/:path*"],
};
