import { adminRouter } from "~/server/api/routers/admin";
import { chatRouter, configRouter, voiceRouter } from "~/server/api/routers/chat";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  config: configRouter,
  voice: voiceRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
