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
    
    if (data.audio) {
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
      audio.playbackRate = playbackSpeed;
      audio.volume = masterVolume;
      
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
  const promises = friends.map(friend => 
    generateVoice(friend, text, playbackSpeed, masterVolume)
  );
  
  try {
    await Promise.all(promises);
  } catch (error) {
    console.error("Failed to generate voices for all friends:", error);
    throw error;
  }
}
