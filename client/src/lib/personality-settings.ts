export interface PersonalitySettings {
  stability: number;
  similarity: number;
}

export const personalitySettings: Record<string, PersonalitySettings> = {
  cheerful: { stability: 0.75, similarity: 0.85 },
  romantic: { stability: 0.80, similarity: 0.90 },
  unhinged: { stability: 0.25, similarity: 0.70 },
  sarcastic: { stability: 0.60, similarity: 0.75 },
  wise: { stability: 0.85, similarity: 0.80 },
};
