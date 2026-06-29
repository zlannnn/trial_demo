import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";

import { db } from "~/server/db";

/**
 * JWT 会话中的 user.id 在库表重建或迁移后可能已不存在。
 * 按 email 解析/创建 DB 用户，保证外键（conversations.userId 等）始终有效。
 */
export async function ensureDbUser(session: Session): Promise<string> {
  const { email, name, image } = session.user;
  const sessionId = session.user.id;

  if (email) {
    const user = await db.user.upsert({
      where: { email },
      create: {
        email,
        name: name ?? null,
        image: image ?? null,
      },
      update: {
        name: name ?? null,
        image: image ?? null,
      },
    });
    return user.id;
  }

  const existing = await db.user.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  throw new TRPCError({
    code: "UNAUTHORIZED",
    message: "无法关联数据库用户，请重新登录",
  });
}
