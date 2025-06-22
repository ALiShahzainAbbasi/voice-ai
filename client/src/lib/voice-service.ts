import { apiRequest } from "./queryClient";
import { analyzeSentiment, getVoiceRecommendations } from "./sentiment-analyzer";
import type { Friend } from "@shared/schema";

export async function generateVoice(
  friend: Friend,
  text: string,
  playbackSpeed: number = 1.0,
  masterVolume: number = 1.0,
  enableSentimentAnalysis: boolean = true
): Promise<void> {
  try {
    let stability = friend.stability;
    let similarity = friend.similarity;
    
    // Apply sentiment-based adjustments if enabled
    if (enableSentimentAnalysis) {
      const sentiment = analyzeSentiment(text);
      const recommendations = getVoiceRecommendations(sentiment, friend.personality);
      
      stability = Math.max(0, Math.min(1, stability + recommendations.stabilityAdjustment));
      similarity = Math.max(0, Math.min(1, similarity + recommendations.similarityAdjustment));
    }

    const response = await apiRequest("POST", "/api/generate-voice", {
      text,
      voiceId: friend.voiceId,
      stability,
      similarity,
    });

    const data = await response.json();
    
    if (data.audioUrl) {
      const audio = new Audio(data.audioUrl);
      audio.playbackRate = playbackSpeed;
      audio.volume = masterVolume / 100; // Convert percentage to decimal
      
      return new Promise((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("Audio playback failed"));
        audio.play().catch(reject);
      });
    }
  } catch (error) {
    console.error("Voice generation failed:", error);
    throw new Error("Failed to generate voice");
  }
}

export function getVoiceMoodRecommendations(text: string, personality: string) {
  const sentiment = analyzeSentiment(text);
  const recommendations = getVoiceRecommendations(sentiment, personality);
  
  return {
    sentiment,
    recommendations,
    suggestedStability: recommendations.stabilityAdjustment,
    suggestedSimilarity: recommendations.similarityAdjustment
  };
}

export async function generateVoiceForAllFriends(
  friends: Friend[],
  text: string,
  playbackSpeed: number = 1.0,
  masterVolume: number = 1.0
): Promise<void> {
  // Generate voices sequentially with proper audio timing to prevent overlap
  for (let i = 0; i < friends.length; i++) {
    const friend = friends[i];
    try {
      console.log(`Generating voice for ${friend.name} (${i + 1}/${friends.length})`);
      
      // Generate and play voice
      await generateVoice(friend, text, playbackSpeed, masterVolume);
      
      // Wait for audio to finish before starting next one
      // Estimate audio duration based on text length (approximately 150 words per minute)
      const estimatedDurationMs = (text.split(' ').length / 150) * 60 * 1000;
      const minDelay = Math.max(2000, estimatedDurationMs + 1000); // At least 2 seconds, plus estimated duration
      
      if (i < friends.length - 1) { // Don't delay after the last friend
        console.log(`Waiting ${minDelay}ms before next friend...`);
        await new Promise(resolve => setTimeout(resolve, minDelay));
      }
    } catch (error) {
      console.error(`Failed to generate voice for ${friend.name}:`, error);
      // Continue with other friends even if one fails, but still wait to maintain timing
      if (i < friends.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}
