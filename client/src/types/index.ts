// Common types used across the application
export interface ConversationMessage {
  id: string;
  speaker: 'user' | 'host' | 'friend';
  friendId?: number;
  text: string;
  timestamp: Date;
  voiceUrl?: string;
  isPlaying?: boolean;
}

export interface ConversationState {
  messages: ConversationMessage[];
  isActive: boolean;
  participants: any[];
  lastSpeaker?: string;
}

export interface ConversationTemplate {
  id: string;
  name: string;
  scenario: string;
  suggestedText: string;
}

export interface ConversationContext {
  id: string;
  type: 'message' | 'email' | 'social' | 'document';
  title: string;
  content: string;
  source?: string;
  timestamp: Date;
  tags: string[];
}

export interface VoiceClone {
  id: string;
  name: string;
  description: string;
  audioUrl: string;
  voiceId?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  createdAt: Date;
}

export interface TalkingVideo {
  id: string;
  name: string;
  sourceImage: string;
  audioText: string;
  voiceId: string;
  videoUrl?: string;
  audioUrl?: string;
  status: 'preparing' | 'processing' | 'ready' | 'error';
  createdAt: Date;
  duration?: number;
}

export interface VoiceMetadata {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  accent: string;
  age: string;
  gender: string;
  use_case: string;
}

export interface AppSettings {
  playbackSpeed: number;
  masterVolume: number;
  autoSaveFriends: boolean;
  lastTextInput: string;
}

// UI Component Props
export interface SpeechInputProps {
  onTextSubmit: (text: string) => void;
  isProcessing?: boolean;
}

export interface ConversationDisplayProps {
  conversationState: ConversationState;
  onPlayMessage: (message: ConversationMessage) => void;
  onStartConversation: () => void;
  onStopConversation: () => void;
  isLoading?: boolean;
}

export interface VoiceControlPanelProps {
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
}

export interface ConversationIntegrationProps {
  onTextGenerated: (text: string) => void;
  onTemplateSelected?: (templateScenario: string) => void;
}

export interface ConversationContextProps {
  contexts: ConversationContext[];
  onContextsChange: (contexts: ConversationContext[]) => void;
  onContextApplied?: (context: string) => void;
}