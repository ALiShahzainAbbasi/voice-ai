import { VOICE_SETTINGS, FILE_LIMITS } from '@/constants';

/**
 * Audio utility functions for voice processing and validation
 */

export const AudioUtils = {
  /**
   * Convert blob URL to base64 data URL
   */
  async blobToBase64(blobUrl: string): Promise<string> {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Validate audio file type and size
   */
  validateAudioFile(file: File): { isValid: boolean; error?: string } {
    if (!FILE_LIMITS.ACCEPTED_AUDIO_TYPES.includes(file.type as any)) {
      return {
        isValid: false,
        error: `Invalid audio format. Accepted formats: ${FILE_LIMITS.ACCEPTED_AUDIO_TYPES.join(', ')}`
      };
    }

    const maxSizeBytes = FILE_LIMITS.MAX_AUDIO_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File too large. Maximum size: ${FILE_LIMITS.MAX_AUDIO_SIZE_MB}MB`
      };
    }

    return { isValid: true };
  },

  /**
   * Get supported media recorder options
   */
  getMediaRecorderOptions(): MediaRecorderOptions {
    const options: MediaRecorderOptions = {};
    
    // Try different formats in order of preference
    for (const mimeType of VOICE_SETTINGS.RECORDING_FORMATS) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options.mimeType = mimeType;
        break;
      }
    }

    return options;
  },

  /**
   * Create audio element with error handling
   */
  createAudioElement(src: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.addEventListener('loadeddata', () => resolve(audio));
      audio.addEventListener('error', (e) => reject(new Error('Failed to load audio')));
      
      audio.src = src;
      audio.load();
    });
  },

  /**
   * Play audio with volume and speed controls
   */
  async playAudio(
    src: string, 
    options: { volume?: number; playbackRate?: number } = {}
  ): Promise<void> {
    const audio = await this.createAudioElement(src);
    
    if (options.volume !== undefined) {
      audio.volume = Math.max(0, Math.min(1, options.volume));
    }
    
    if (options.playbackRate !== undefined) {
      audio.playbackRate = Math.max(0.25, Math.min(4, options.playbackRate));
    }
    
    return audio.play();
  },

  /**
   * Generate unique audio ID
   */
  generateAudioId(): string {
    return `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Format audio duration
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
};