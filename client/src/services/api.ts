import { API_ENDPOINTS } from '@/constants';
import type { VoiceClone, TalkingVideo } from '@/types';

/**
 * Centralized API service layer for all backend communications
 */

export class ApiService {
  /**
   * Base request method with error handling
   */
  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Friends API
   */
  static friends = {
    getAll: () => ApiService.request(API_ENDPOINTS.FRIENDS),
    
    create: (friend: any) => 
      ApiService.request(API_ENDPOINTS.FRIENDS, {
        method: 'POST',
        body: JSON.stringify(friend),
      }),
    
    update: (id: number, friend: any) => 
      ApiService.request(`${API_ENDPOINTS.FRIENDS}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(friend),
      }),
    
    delete: (id: number) => 
      ApiService.request(`${API_ENDPOINTS.FRIENDS}/${id}`, {
        method: 'DELETE',
      }),
  };

  /**
   * Voice API
   */
  static voice = {
    generateSample: (voiceId: string, sampleType: string = 'greeting') =>
      ApiService.request(API_ENDPOINTS.VOICE_SAMPLE, {
        method: 'POST',
        body: JSON.stringify({ voiceId, sampleType }),
      }),

    createClone: async (data: {
      name: string;
      description: string;
      audioData: string;
    }): Promise<VoiceClone> =>
      ApiService.request(API_ENDPOINTS.VOICE_CLONE, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    generateTalkingVideo: async (data: {
      name: string;
      text: string;
      voiceId: string;
    }): Promise<TalkingVideo> =>
      ApiService.request(API_ENDPOINTS.TALKING_VIDEO, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  /**
   * Conversation API
   */
  static conversation = {
    generate: (data: {
      userText: string;
      friendPersonality: string;
      conversationHistory?: any[];
      contexts?: any[];
    }) =>
      ApiService.request(API_ENDPOINTS.CONVERSATION, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  /**
   * Health check
   */
  static health = {
    check: () => ApiService.request('/api/health'),
  };
}