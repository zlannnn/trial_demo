import { z } from "zod";

import { agent } from "~/server/ai/agent";
import {
  aiConfig,
  isVoiceSttAvailable,
  isVoiceTtsAvailable,
  voicePhaseConfig,
} from "~/server/ai/config";
import {
  createConversation,
  deleteAllConversations,
  deleteConversation,
  getConversationMessages,
  listConversations,
} from "~/server/chat/service";
import { loadConversationConfirmation } from "~/server/contract/conversation-confirmation";
import { computeTaskProgress } from "~/server/contract/tasks";
import { transcribeAudio } from "~/server/voice/stt";
import { synthesizeSpeechStream } from "~/server/voice/tts";
import { voiceConfig } from "~/server/voice/config";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const chatRouter = createTRPCRouter({
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    const conversations = await listConversations(ctx.session.user.id);
    return { conversations };
  }),

  createConversation: protectedProcedure.mutation(async ({ ctx }) => {
    return createConversation(ctx.session.user.id);
  }),

  deleteConversation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await deleteConversation(input.id, ctx.session.user.id);
      if (!deleted) {
        throw new Error("Conversation not found");
      }
      return { success: true };
    }),

  deleteAllConversations: protectedProcedure.mutation(async ({ ctx }) => {
    const count = await deleteAllConversations(ctx.session.user.id);
    return { count };
  }),

  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const messages = await getConversationMessages(
        input.conversationId,
        ctx.session.user.id,
      );
      if (!messages) {
        throw new Error("Conversation not found");
      }
      return { messages };
    }),

  getTaskProgress: protectedProcedure
    .input(z.object({ conversationId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.conversationId) {
        return computeTaskProgress(null);
      }
      const confirmation = await loadConversationConfirmation(
        input.conversationId,
        ctx.session.user.id,
      );
      return computeTaskProgress(confirmation);
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(10000),
        conversationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await agent.run({
        userId: ctx.session.user.id,
        message: input.message,
        session: {
          conversationId: input.conversationId,
        },
      });

      const messages = await getConversationMessages(
        result.session.conversationId,
        ctx.session.user.id,
      );

      const confirmation = await loadConversationConfirmation(
        result.session.conversationId,
        ctx.session.user.id,
      );
      const taskProgress = computeTaskProgress(confirmation);

      return {
        reply: result.reply,
        conversationId: result.session.conversationId,
        structured: result.structured,
        taskProgress,
        toolCalls: result.toolCalls.map((tc) => ({
          callId: tc.callId,
          name: tc.name,
          arguments: tc.arguments,
          success: tc.success,
          result: tc.result,
        })),
        messages: messages ?? [],
      };
    }),
});

export const configRouter = createTRPCRouter({
  getAppConfig: protectedProcedure.query(() => {
    const sttAvailable = isVoiceSttAvailable();
    const ttsAvailable = isVoiceTtsAvailable();

    return {
      provider: aiConfig.provider,
      model: aiConfig.model,
      voice: {
        sttEnabled: voicePhaseConfig.sttEnabled,
        ttsEnabled: voicePhaseConfig.ttsEnabled,
        sttAvailable,
        ttsAvailable,
        realtimeEnabled: voicePhaseConfig.realtimeEnabled,
        unavailableHint:
          !sttAvailable || !ttsAvailable
            ? "语音功能需要配置 OPENAI_API_KEY（用于 Whisper STT / TTS）"
            : undefined,
      },
    };
  }),
});

const ttsVoiceEnum = z.enum([
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
]);

export const voiceRouter = createTRPCRouter({
  transcribe: protectedProcedure
    .input(
      z.object({
        audioBase64: z.string().min(1),
        mimeType: z.string().optional(),
        filename: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!isVoiceSttAvailable()) {
        throw new Error(
          "Voice STT is not enabled. Set VOICE_STT_ENABLED=true and OPENAI_API_KEY.",
        );
      }

      const buffer = Buffer.from(input.audioBase64, "base64");
      if (buffer.length === 0) {
        throw new Error("Audio file is empty");
      }
      if (buffer.length > voiceConfig.maxAudioSizeBytes) {
        throw new Error("Audio file exceeds 25MB limit");
      }

      const mimeType = input.mimeType ?? "audio/webm";
      const filename = input.filename ?? "recording.webm";
      const blob = new Blob([buffer], { type: mimeType });
      const file = new File([blob], filename, { type: mimeType });

      return transcribeAudio(file, filename);
    }),

  synthesize: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(4096),
        voice: ttsVoiceEnum.optional(),
        speed: z.number().min(0.25).max(4).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!isVoiceTtsAvailable()) {
        throw new Error(
          "Voice TTS is not enabled. Set VOICE_TTS_ENABLED=true and OPENAI_API_KEY.",
        );
      }

      const stream = await synthesizeSpeechStream(input.text, {
        voice: input.voice,
        speed: input.speed,
      });

      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) chunks.push(result.value);
      }

      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const merged = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      return {
        audioBase64: Buffer.from(merged).toString("base64"),
        contentType: "audio/mpeg",
      };
    }),
});
