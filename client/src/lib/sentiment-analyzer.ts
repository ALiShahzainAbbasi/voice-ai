export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  intensity: number; // 0.0 to 1.0
  confidence: number;
}

const positiveWords = [
  'amazing', 'awesome', 'beautiful', 'brilliant', 'excellent', 'fantastic', 'great', 'happy',
  'incredible', 'joy', 'love', 'magnificent', 'outstanding', 'perfect', 'wonderful', 'delighted',
  'thrilled', 'excited', 'cheerful', 'optimistic', 'pleased', 'satisfied', 'glad', 'grateful',
  'blessed', 'fortunate', 'lucky', 'proud', 'confident', 'hopeful', 'inspired', 'motivated'
];

const negativeWords = [
  'awful', 'bad', 'terrible', 'horrible', 'disgusting', 'hate', 'angry', 'frustrated',
  'disappointed', 'sad', 'depressed', 'upset', 'annoyed', 'furious', 'enraged', 'devastated',
  'heartbroken', 'miserable', 'pathetic', 'worthless', 'useless', 'hopeless', 'defeated',
  'discouraged', 'worried', 'anxious', 'scared', 'fearful', 'nervous', 'stressed', 'overwhelmed'
];

const intensifiers = ['very', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely', 'utterly'];
const diminishers = ['slightly', 'somewhat', 'kind of', 'sort of', 'a bit', 'a little'];

export function analyzeSentiment(text: string): SentimentResult {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  let positiveScore = 0;
  let negativeScore = 0;
  let totalWords = words.length;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let multiplier = 1;
    
    // Check for intensifiers/diminishers before the word
    if (i > 0) {
      const prevWord = words[i - 1];
      if (intensifiers.includes(prevWord)) {
        multiplier = 1.5;
      } else if (diminishers.includes(prevWord)) {
        multiplier = 0.7;
      }
    }
    
    if (positiveWords.includes(word)) {
      positiveScore += multiplier;
    } else if (negativeWords.includes(word)) {
      negativeScore += multiplier;
    }
  }
  
  // Normalize scores
  const totalScore = positiveScore + negativeScore;
  const netScore = positiveScore - negativeScore;
  
  // Determine sentiment
  let sentiment: 'positive' | 'negative' | 'neutral';
  let intensity: number;
  let confidence: number;
  
  if (totalScore === 0) {
    sentiment = 'neutral';
    intensity = 0;
    confidence = 0.5;
  } else {
    const sentimentRatio = netScore / totalScore;
    confidence = Math.min(totalScore / Math.max(totalWords * 0.1, 1), 1);
    
    if (sentimentRatio > 0.2) {
      sentiment = 'positive';
      intensity = Math.min(sentimentRatio, 1);
    } else if (sentimentRatio < -0.2) {
      sentiment = 'negative';
      intensity = Math.min(Math.abs(sentimentRatio), 1);
    } else {
      sentiment = 'neutral';
      intensity = Math.abs(sentimentRatio);
    }
  }
  
  return {
    sentiment,
    intensity: Math.round(intensity * 100) / 100,
    confidence: Math.round(confidence * 100) / 100
  };
}

export function getVoiceRecommendations(sentiment: SentimentResult, personality: string): {
  stabilityAdjustment: number;
  similarityAdjustment: number;
  reasoning: string;
} {
  const { sentiment: mood, intensity } = sentiment;
  
  let stabilityAdjustment = 0;
  let similarityAdjustment = 0;
  let reasoning = '';
  
  // Base adjustments by sentiment
  switch (mood) {
    case 'positive':
      stabilityAdjustment = intensity * 0.2; // More stable for positive emotions
      similarityAdjustment = intensity * 0.1; // Slightly higher similarity
      reasoning = 'Positive sentiment suggests higher stability for clearer expression';
      break;
      
    case 'negative':
      stabilityAdjustment = -intensity * 0.3; // Less stable for emotional expression
      similarityAdjustment = -intensity * 0.05; // Slightly lower similarity for emotion
      reasoning = 'Negative sentiment benefits from lower stability for emotional depth';
      break;
      
    case 'neutral':
      stabilityAdjustment = 0.1; // Slight increase for clarity
      similarityAdjustment = 0;
      reasoning = 'Neutral sentiment uses balanced settings for clear delivery';
      break;
  }
  
  // Personality-based modifications
  switch (personality.toLowerCase()) {
    case 'cheerful':
      if (mood === 'negative') {
        stabilityAdjustment += 0.1; // Cheerful personality softens negative emotions
        reasoning += '. Cheerful personality maintains some optimism even in negative content.';
      }
      break;
      
    case 'romantic':
      stabilityAdjustment += 0.05; // Romantic is generally more stable and smooth
      similarityAdjustment += 0.05;
      reasoning += '. Romantic personality adds warmth and smoothness.';
      break;
      
    case 'unhinged':
      stabilityAdjustment -= 0.2; // Always more unstable for unhinged
      reasoning += '. Unhinged personality amplifies emotional instability.';
      break;
      
    case 'sarcastic':
      if (mood === 'positive') {
        stabilityAdjustment -= 0.1; // Sarcastic reduces stability even for positive content
        reasoning += '. Sarcastic personality adds edge even to positive content.';
      }
      break;
      
    case 'wise':
      stabilityAdjustment += 0.1; // Wise is always more measured
      reasoning += '. Wise personality maintains composure and clarity.';
      break;
  }
  
  // Clamp values to reasonable ranges
  stabilityAdjustment = Math.max(-0.4, Math.min(0.4, stabilityAdjustment));
  similarityAdjustment = Math.max(-0.2, Math.min(0.2, similarityAdjustment));
  
  return {
    stabilityAdjustment: Math.round(stabilityAdjustment * 100) / 100,
    similarityAdjustment: Math.round(similarityAdjustment * 100) / 100,
    reasoning
  };
}