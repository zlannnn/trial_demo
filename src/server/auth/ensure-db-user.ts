import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";

import { db } from "~/server/db";

/**
 * 将会话解析为数据库中的 userId。
 * 仅查找已存在用户，不自动创建——避免产生无 OAuth 关联的孤儿账号导致 Google 登录失败。
 */
export async function ensureDbUser(session: Session): Promise<string> {
  const { email } = session.user;
  const sessionId = session.user.id;

  if (email) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) return user.id;
  }

  const byId = await db.user.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });
  if (byId) return byId.id;

  throw new TRPCError({
    code: "UNAUTHORIZED",
    message: "会话已失效，请重新登录",
  });
}

/** 登录成功后，JWT 中写入数据库 userId（按 email 匹配） */
export async function resolveDbUserIdForAuthUser(
  authUser: { id?: string | null; email?: string | null },
): Promise<string | undefined> {
  if (authUser.email) {
    const user = await db.user.findUnique({
      where: { email: authUser.email },
      select: { id: true },
    });
    if (user) return user.id;
  }

  if (authUser.id) {
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      select: { id: true },
    });
    if (user) return user.id;
  }

  return authUser.id ?? undefined;
}
