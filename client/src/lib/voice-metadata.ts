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

export const voiceMetadata: Record<string, VoiceMetadata> = {
  "9BWtsMINqrJLrRacOk9x": {
    voice_id: "9BWtsMINqrJLrRacOk9x",
    name: "Aria",
    category: "Conversational",
    description: "A warm, friendly female voice with perfect clarity for everyday conversations",
    accent: "American",
    age: "Young Adult",
    gender: "Female",
    use_case: "General conversation, customer service, friendly chat"
  },
  "EXAVITQu4vr4xnSDxMaL": {
    voice_id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    category: "Professional",
    description: "Confident and professional female voice, ideal for business presentations",
    accent: "American",
    age: "Adult",
    gender: "Female",
    use_case: "Business, presentations, professional communication"
  },
  "VR6AewLTigWG4xSOukaG": {
    voice_id: "VR6AewLTigWG4xSOukaG",
    name: "Arnold",
    category: "Narrative",
    description: "Deep, authoritative male voice perfect for storytelling and narration",
    accent: "American",
    age: "Mature",
    gender: "Male",
    use_case: "Storytelling, documentaries, authoritative content"
  },
  "pNInz6obpgDQGcFmaJgB": {
    voice_id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    category: "Conversational",
    description: "Natural, relaxed male voice with a casual, approachable tone",
    accent: "American",
    age: "Young Adult",
    gender: "Male",
    use_case: "Casual conversation, gaming, informal content"
  },
  "21m00Tcm4TlvDq8ikWAM": {
    voice_id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    category: "Premium",
    description: "Sophisticated, elegant female voice with excellent emotional range",
    accent: "American",
    age: "Adult",
    gender: "Female",
    use_case: "Premium content, emotional scenes, sophisticated dialogue"
  },
  "AZnzlk1XvdvUeBnXmlld": {
    voice_id: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    category: "Young",
    description: "Energetic, youthful female voice perfect for upbeat content",
    accent: "American",
    age: "Young",
    gender: "Female",
    use_case: "Youth content, energetic presentations, casual streaming"
  },
  "ErXwobaYiN019PkySvjV": {
    voice_id: "ErXwobaYiN019PkySvjV",
    name: "Antoni",
    category: "Creative",
    description: "Artistic and expressive male voice with emotional depth",
    accent: "American",
    age: "Adult",
    gender: "Male",
    use_case: "Creative content, artistic expression, emotional storytelling"
  },
  "MF3mGyEYCl7XYWbV9V6O": {
    voice_id: "MF3mGyEYCl7XYWbV9V6O",
    name: "Elli",
    category: "Youthful",
    description: "Bright, cheerful female voice with youthful energy",
    accent: "American",
    age: "Young",
    gender: "Female",
    use_case: "Youth-oriented content, cheerful presentations, casual conversation"
  },
  "TxGEqnHWrfWFTfGW9XjX": {
    voice_id: "TxGEqnHWrfWFTfGW9XjX",
    name: "Josh",
    category: "Enthusiastic",
    description: "Energetic, enthusiastic male voice perfect for engaging content",
    accent: "American",
    age: "Young Adult",
    gender: "Male",
    use_case: "Energetic presentations, sports commentary, motivational content"
  },
  "CYw3kZ02Hs0563khs1Fj": {
    voice_id: "CYw3kZ02Hs0563khs1Fj",
    name: "Dave",
    category: "Conversational",
    description: "Friendly, approachable male voice with natural conversational flow",
    accent: "British",
    age: "Adult",
    gender: "Male",
    use_case: "Podcasts, interviews, friendly conversation"
  },
  "D38z5RcWu1voky8WS1ja": {
    voice_id: "D38z5RcWu1voky8WS1ja",
    name: "Fin",
    category: "Character",
    description: "Distinctive male voice with character and personality",
    accent: "Irish",
    age: "Adult",
    gender: "Male",
    use_case: "Character voices, unique personalities, creative content"
  },
  "JBFqnCBsd6RMkjVDRZzb": {
    voice_id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George",
    category: "Mature",
    description: "Warm, mature male voice with wisdom and gravitas",
    accent: "British",
    age: "Senior",
    gender: "Male",
    use_case: "Wise characters, educational content, mature perspectives"
  },
  "N2lVS1w4EtoT3dr4eOWO": {
    voice_id: "N2lVS1w4EtoT3dr4eOWO",
    name: "Callum",
    category: "Narrative",
    description: "Rich, expressive male voice ideal for dramatic readings",
    accent: "British",
    age: "Adult",
    gender: "Male",
    use_case: "Dramatic readings, theater, expressive content"
  },
  "oWAxZDx7w5VEj9dCyTzz": {
    voice_id: "oWAxZDx7w5VEj9dCyTzz",
    name: "Grace",
    category: "Elegant",
    description: "Sophisticated, graceful female voice with refined articulation",
    accent: "British",
    age: "Adult",
    gender: "Female",
    use_case: "Elegant presentations, sophisticated content, formal speeches"
  },
  "onwK4e9ZLuTAKqWW03F9": {
    voice_id: "onwK4e9ZLuTAKqWW03F9",
    name: "Daniel",
    category: "Authoritative",
    description: "Strong, commanding male voice with natural authority",
    accent: "British",
    age: "Adult",
    gender: "Male",
    use_case: "Leadership content, authoritative announcements, professional guidance"
  }
};

export function getVoiceMetadata(voiceId: string): VoiceMetadata | undefined {
  return voiceMetadata[voiceId];
}

export function getAllVoiceMetadata(): VoiceMetadata[] {
  return Object.values(voiceMetadata);
}

export const sampleTexts = {
  greeting: "Hello! This is a sample of my voice. How do you think I sound?",
  professional: "Good morning. I'm pleased to present today's quarterly business review.",
  emotional: "I understand this is difficult for you. Please know that you're not alone.",
  storytelling: "Once upon a time, in a land far away, there lived a brave young hero.",
  casual: "Hey there! Just wanted to check in and see how you're doing today."
};