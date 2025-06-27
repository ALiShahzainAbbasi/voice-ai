import type { ConversationTemplate } from '@/types';

// Conversation Templates
export const CONVERSATION_TEMPLATES: ConversationTemplate[] = [
  {
    id: "friendly-chat",
    name: "Friendly Chat",
    scenario: "Casual conversation with a friend",
    suggestedText: "Hey there! How's your day going? I was just thinking about that amazing coffee shop we went to last week."
  },
  {
    id: "emotional-support",
    name: "Emotional Support",
    scenario: "Providing comfort and encouragement",
    suggestedText: "I'm really sorry you're going through this difficult time. Remember that you're stronger than you think, and this too shall pass."
  },
  {
    id: "professional-meeting",
    name: "Professional Meeting",
    scenario: "Business or work-related discussion",
    suggestedText: "Good morning everyone. I'd like to discuss the quarterly results and our strategic plans for the upcoming quarter."
  },
  {
    id: "storytelling",
    name: "Storytelling",
    scenario: "Narrating a story or experience",
    suggestedText: "Once upon a time, in a small village nestled between rolling hills, there lived a young inventor who dreamed of changing the world."
  },
  {
    id: "debate-discussion",
    name: "Debate/Discussion",
    scenario: "Expressing strong opinions or arguments",
    suggestedText: "I strongly believe that renewable energy is the key to our future. The evidence clearly shows that solar and wind power are becoming more cost-effective."
  }
];

// Default Settings
export const DEFAULT_SETTINGS = {
  playbackSpeed: 1.0,
  masterVolume: 0.8,
  autoSaveFriends: true,
  lastTextInput: ""
};

// Storage Keys
export const STORAGE_KEYS = {
  FRIENDS: 'voice-lab-friends',
  SETTINGS: 'voice-lab-settings',
  BACKUP: 'voice-lab-backup'
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  FRIENDS: '/api/friends',
  VOICE_SAMPLE: '/api/voice-sample',
  VOICE_CLONE: '/api/create-voice-clone',
  TALKING_VIDEO: '/api/generate-talking-video',
  CONVERSATION: '/api/generate-conversation'
} as const;

// Voice Settings
export const VOICE_SETTINGS = {
  DEFAULT_STABILITY: 0.75,
  DEFAULT_SIMILARITY: 0.85,
  SAMPLE_RATE: 44100,
  RECORDING_FORMATS: ['audio/webm', 'audio/wav', 'audio/mpeg'] as const
} as const;

// UI Constants
export const UI_CONSTANTS = {
  MAX_FRIENDS: 10,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_CONTEXT_LENGTH: 2000,
  MAX_NAME_LENGTH: 50,
  CONVERSATION_DELAY_MS: 5000,
  AUTO_PLAY_DELAY_MS: 100
} as const;

// File Upload Limits
export const FILE_LIMITS = {
  MAX_AUDIO_SIZE_MB: 10,
  MAX_IMAGE_SIZE_MB: 5,
  ACCEPTED_AUDIO_TYPES: ['audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'],
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
} as const;