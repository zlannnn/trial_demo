export type VoiceStatus =
  | "idle"
  | "recording"
  | "uploading"
  | "transcribing"
  | "speaking"
  | "error";

export interface TranscribeResponse {
  text: string;
  language?: string;
  duration?: number;
}

export interface VoiceError {
  code: string;
  message: string;
}

export interface StreamProgress {
  bytesReceived: number;
  totalBytes?: number;
}

export interface TtsRequest {
  text: string;
  voice?: string;
  speed?: number;
}

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  isSupported: boolean;
  durationMs: number;
  audioBlob: Blob | null;
  mimeType: string | null;
  error: VoiceError | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  resetRecording: () => void;
}

export interface UseVoiceInputReturn {
  status: VoiceStatus;
  transcript: string | null;
  error: VoiceError | null;
  isRecording: boolean;
  durationMs: number;
  startRecording: () => Promise<void>;
  stopAndTranscribe: () => Promise<string | null>;
  reset: () => void;
}

export interface UseVoiceOutputReturn {
  status: VoiceStatus;
  isSpeaking: boolean;
  progress: StreamProgress | null;
  error: VoiceError | null;
  speak: (text: string, options?: TtsRequest) => Promise<void>;
  stop: () => void;
}

export interface UseVoiceChatOptions {
  onTranscript?: (text: string) => void;
  onReply?: (text: string) => void;
  /** 外部 AI 处理函数 — 接收用户文本，返回 AI 回复 */
  onSendMessage?: (text: string) => Promise<string>;
  autoSpeak?: boolean;
  language?: string;
}

export interface UseVoiceChatReturn {
  status: VoiceStatus;
  transcript: string | null;
  reply: string | null;
  error: VoiceError | null;
  isRecording: boolean;
  isSpeaking: boolean;
  startRecording: () => Promise<void>;
  stopAndProcess: () => Promise<void>;
  reset: () => void;
}
