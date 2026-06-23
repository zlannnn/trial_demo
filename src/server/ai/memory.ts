import { db } from "~/server/db";

import { formatBirthday } from "./tools/helpers";
import type { UserMemory } from "./types";

/**
 * 从数据库加载用户长期记忆（档案 + 基本信息）
 * 注入到 System Instructions，不依赖 OpenAI 短期上下文
 */
export async function loadUserMemory(userId: string): Promise<UserMemory> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      profile: {
        select: {
          birthday: true,
          gender: true,
          phone: true,
          address: true,
          notes: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile
      ? {
          birthday: formatBirthday(user.profile.birthday),
          gender: user.profile.gender,
          phone: user.profile.phone,
          address: user.profile.address,
          notes: user.profile.notes,
        }
      : null,
  };
}

/** 刷新记忆 — 工具执行后调用，确保下一轮 instructions 是最新档案 */
export { loadUserMemory as refreshUserMemory };
