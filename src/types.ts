export interface VocalDNA {
  tone: string;
  actingPrompt: string;
  essenceSummary: string;
  pitchModifier?: 'higher' | 'lower' | 'neutral';
}

export interface Persona {
  id: string;
  name: string;
  avatar: string;
  description: string;
  script: string;
  voiceId: string;
  personality?: string;
  creatorId?: string; // UID of the creator
  voiceSampleUrl?: string; // Original audio essence
  vocalDNA?: VocalDNA;
  color: string;
  isHidden?: boolean;
  tags?: string[];
  photoIsManual?: boolean;
}

export interface ChatMessage {
  id: string;
  botId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  audioContent?: string; // Cache for the generated audio base64
}

export interface Sanctum {
  id: string;
  botId: string;
  name: string;
  messages: ChatMessage[];
}

export type ResponseLength = 'short' | 'medium' | 'long';

export interface PublicVoice {
  id: string;
  characterName: string;
  vocalDNA: VocalDNA;
  voiceId: string;
  creatorId: string;
  creatorName: string;
  usageCount: number;
  createdAt: number;
}
