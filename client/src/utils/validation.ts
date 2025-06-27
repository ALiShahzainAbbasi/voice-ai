import { UI_CONSTANTS } from '@/constants';

/**
 * Validation utilities for form inputs and data
 */

export const ValidationUtils = {
  /**
   * Validate friend name
   */
  validateFriendName(name: string): { isValid: boolean; error?: string } {
    if (!name || !name.trim()) {
      return { isValid: false, error: 'Name is required' };
    }

    if (name.trim().length > UI_CONSTANTS.MAX_NAME_LENGTH) {
      return { 
        isValid: false, 
        error: `Name must be ${UI_CONSTANTS.MAX_NAME_LENGTH} characters or less` 
      };
    }

    return { isValid: true };
  },

  /**
   * Validate description
   */
  validateDescription(description: string): { isValid: boolean; error?: string } {
    if (description.length > UI_CONSTANTS.MAX_DESCRIPTION_LENGTH) {
      return { 
        isValid: false, 
        error: `Description must be ${UI_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters or less` 
      };
    }

    return { isValid: true };
  },

  /**
   * Validate context content
   */
  validateContextContent(content: string): { isValid: boolean; error?: string } {
    if (!content || !content.trim()) {
      return { isValid: false, error: 'Content is required' };
    }

    if (content.length > UI_CONSTANTS.MAX_CONTEXT_LENGTH) {
      return { 
        isValid: false, 
        error: `Content must be ${UI_CONSTANTS.MAX_CONTEXT_LENGTH} characters or less` 
      };
    }

    return { isValid: true };
  },

  /**
   * Validate email format
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !email.trim()) {
      return { isValid: false, error: 'Email is required' };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
  },

  /**
   * Validate URL format
   */
  validateUrl(url: string): { isValid: boolean; error?: string } {
    if (!url || !url.trim()) {
      return { isValid: true }; // URLs are optional
    }

    try {
      new URL(url);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Invalid URL format' };
    }
  },

  /**
   * Validate voice settings
   */
  validateVoiceSettings(stability: number, similarity: number): { isValid: boolean; error?: string } {
    if (stability < 0 || stability > 1) {
      return { isValid: false, error: 'Stability must be between 0 and 1' };
    }

    if (similarity < 0 || similarity > 1) {
      return { isValid: false, error: 'Similarity must be between 0 and 1' };
    }

    return { isValid: true };
  },

  /**
   * Validate age range
   */
  validateAge(age: number): { isValid: boolean; error?: string } {
    if (age < 1 || age > 150) {
      return { isValid: false, error: 'Age must be between 1 and 150' };
    }

    return { isValid: true };
  },

  /**
   * Sanitize text input
   */
  sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[<>]/g, ''); // Remove potential HTML tags
  },

  /**
   * Validate required fields
   */
  validateRequired(value: any, fieldName: string): { isValid: boolean; error?: string } {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    return { isValid: true };
  }
};