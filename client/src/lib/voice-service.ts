import { apiRequest } from "./queryClient";
import type { Friend } from "@shared/schema";

export async function generateVoice(
  friend: Friend,
  text: string,
  playbackSpeed: number = 1.0,
  masterVolume: number = 1.0
): Promise<void> {
  try {
    const response = await apiRequest("POST", "/api/generate-voice", {
      text,
      voiceId: friend.voiceId,
      stability: friend.stability,
      similarity: friend.similarity,
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
