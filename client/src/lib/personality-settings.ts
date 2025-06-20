export interface PersonalitySettings {
  stability: number;
  similarity: number;
  description: string;
}

export const personalitySettings: Record<string, PersonalitySettings> = {
  cheerful: { 
    stability: 0.75, 
    similarity: 0.85, 
    description: "Upbeat, positive, and energetic - great for happy conversations" 
  },
  romantic: { 
    stability: 0.80, 
    similarity: 0.90, 
    description: "Warm, intimate, and affectionate - perfect for love and tender moments" 
  },
  unhinged: { 
    stability: 0.25, 
    similarity: 0.70, 
    description: "Wild, unpredictable, and chaotic - for dramatic or intense scenarios" 
  },
  sarcastic: { 
    stability: 0.60, 
    similarity: 0.75, 
    description: "Witty, dry, and ironic - ideal for humor and clever remarks" 
  },
  wise: { 
    stability: 0.85, 
    similarity: 0.80, 
    description: "Calm, thoughtful, and profound - perfect for advice and deep conversations" 
  },
  mysterious: { 
    stability: 0.70, 
    similarity: 0.75, 
    description: "Enigmatic, intriguing, and secretive - for suspenseful storytelling" 
  },
  aggressive: { 
    stability: 0.40, 
    similarity: 0.65, 
    description: "Bold, forceful, and intense - for confrontational or passionate speech" 
  },
  gentle: { 
    stability: 0.90, 
    similarity: 0.85, 
    description: "Soft, soothing, and comforting - ideal for bedtime stories or therapy" 
  },
  confident: { 
    stability: 0.80, 
    similarity: 0.85, 
    description: "Assured, strong, and authoritative - perfect for leadership and presentations" 
  },
  playful: { 
    stability: 0.65, 
    similarity: 0.80, 
    description: "Fun, mischievous, and light-hearted - great for games and entertainment" 
  },
  melancholic: { 
    stability: 0.75, 
    similarity: 0.80, 
    description: "Sad, reflective, and emotional - for expressing grief or deep feelings" 
  },
  authoritative: { 
    stability: 0.85, 
    similarity: 0.75, 
    description: "Commanding, professional, and serious - ideal for business and formal settings" 
  }
};
