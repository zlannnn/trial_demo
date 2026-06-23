import { db } from "~/server/db";

const DEMO_EMAIL = "demo@localhost";

export async function getOrCreateDemoUser() {
  const existing = await db.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, name: true, email: true, avatar: true },
  });

  if (existing) return existing;

  return db.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Demo User",
    },
    select: { id: true, name: true, email: true, avatar: true },
  });
}
