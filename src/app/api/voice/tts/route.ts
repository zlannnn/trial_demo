import { NextResponse } from "next/server";
import { z } from "zod";

import { isVoiceTtsAvailable } from "~/server/ai/config";
import { synthesizeSpeechStream } from "~/server/voice/tts";

export const runtime = "nodejs";

const bodySchema = z.object({
  text: z.string().min(1).max(4096),
  voice: z
    .enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"])
    .optional(),
  speed: z.number().min(0.25).max(4).optional(),
});

export async function POST(request: Request) {
  if (!isVoiceTtsAvailable()) {
    return NextResponse.json(
      {
        error:
          "Voice TTS is not enabled (Phase 3). Set VOICE_TTS_ENABLED=true and OPENAI_API_KEY.",
      },
      { status: 503 },
    );
  }

  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join("; ") },
        { status: 400 },
      );
    }

    const stream = await synthesizeSpeechStream(parsed.data.text, {
      voice: parsed.data.voice,
      speed: parsed.data.speed,
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("[POST /api/voice/tts]", error);
    const message = error instanceof Error ? error.message : "TTS failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
