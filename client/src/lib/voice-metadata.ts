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
    name: "Sarah",
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