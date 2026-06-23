export { AudioPlayer } from "./components/audio-player";
export type { AudioPlayerProps } from "./components/audio-player";

export { MicButton } from "./components/mic-button";
export type { MicButtonProps } from "./components/mic-button";

export { VoiceInput } from "./components/voice-input";
export type { VoiceInputProps } from "./components/voice-input";

export { VoiceChat } from "./components/voice-chat";
export type { VoiceChatProps } from "./components/voice-chat";

export { useAudioRecorder } from "./hooks/use-audio-recorder";
export { useVoiceInput } from "./hooks/use-voice-input";
export { useVoiceOutput } from "./hooks/use-voice-output";
export { useVoiceChat } from "./hooks/use-voice-chat";

export {
  fetchTtsStream,
  synthesizeAndPlay,
  synthesizeToBlob,
  transcribeAudioBlob,
  VoiceApiError,
} from "./lib/voice-api";

export { VOICE_API, PREFERRED_MIME_TYPES } from "./constants";

export type {
  StreamProgress,
  TranscribeResponse,
  TtsRequest,
  UseAudioRecorderReturn,
  UseVoiceChatOptions,
  UseVoiceChatReturn,
  UseVoiceInputReturn,
  UseVoiceOutputReturn,
  VoiceError,
  VoiceStatus,
} from "./types";

export {
  formatDuration,
  getSupportedMimeType,
  readStreamToBlob,
} from "./utils/audio-utils";
