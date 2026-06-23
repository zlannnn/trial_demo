import { db } from "~/server/db";

import type { UserMemory } from "./types";

/**
 * 加载当前用户基本信息（不含跨会话保单数据）
 */
export async function loadUserMemory(userId: string): Promise<UserMemory> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
  };
}

export { loadUserMemory as refreshUserMemory };
