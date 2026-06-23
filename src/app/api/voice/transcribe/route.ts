import { NextResponse } from "next/server";

import { isVoiceSttAvailable } from "~/server/ai/config";
import { transcribeAudio } from "~/server/voice/stt";
import { voiceConfig } from "~/server/voice/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isVoiceSttAvailable()) {
    return NextResponse.json(
      {
        error:
          "Voice STT is not enabled (Phase 3). Set VOICE_STT_ENABLED=true and OPENAI_API_KEY.",
      },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: "Missing audio file in form field 'audio'" },
        { status: 400 },
      );
    }

    if (audio.size === 0) {
      return NextResponse.json({ error: "Audio file is empty" }, { status: 400 });
    }

    if (audio.size > voiceConfig.maxAudioSizeBytes) {
      return NextResponse.json(
        { error: "Audio file exceeds 25MB limit" },
        { status: 413 },
      );
    }

    const result = await transcribeAudio(audio, audio.name || "recording.webm");
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/voice/transcribe]", error);
    const message =
      error instanceof Error ? error.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
