import type { NextAuthConfig } from "next-auth";

/** Edge Middleware 专用：仅解析 JWT，不引入 Prisma */
export const edgeAuthCallbacks: Pick<
  NonNullable<NextAuthConfig["callbacks"]>,
  "jwt" | "session"
> = {
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
};
