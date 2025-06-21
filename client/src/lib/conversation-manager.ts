import { Friend } from "@shared/schema";
import { apiRequest } from "./queryClient";

export interface ConversationMessage {
  id: string;
  speaker: 'user' | 'host' | 'friend';
  friendId?: number;
  text: string;
  timestamp: Date;
  voiceUrl?: string;
  isPlaying?: boolean;
}

export interface ConversationState {
  messages: ConversationMessage[];
  isActive: boolean;
  participants: Friend[];
  lastSpeaker?: string;
}

export class ConversationManager {
  private state: ConversationState;
  private onStateChange: (state: ConversationState) => void;
  private audioContext: AudioContext | null = null;

  constructor(friends: Friend[], onStateChange: (state: ConversationState) => void) {
    this.state = {
      messages: [],
      isActive: false,
      participants: friends,
    };
    this.onStateChange = onStateChange;
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  public updateParticipants(friends: Friend[]) {
    this.state.participants = friends;
    this.notifyStateChange();
  }

  public async startConversation(): Promise<void> {
    if (this.state.participants.length === 0) {
      throw new Error('No virtual friends available for conversation');
    }

    this.state.isActive = true;
    this.state.messages = [];

    // Add host greeting
    const hostMessage: ConversationMessage = {
      id: `host-${Date.now()}`,
      speaker: 'host',
      text: `Hey everyone! Welcome to our voice chat. We have ${this.state.participants.map(f => f.name).join(', ')} here today. What's on your mind?`,
      timestamp: new Date(),
    };

    this.state.messages.push(hostMessage);
    this.notifyStateChange();

    // Generate host voice for greeting
    await this.generateHostVoice(hostMessage);
  }

  public async addUserMessage(text: string): Promise<void> {
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    this.state.messages.push(userMessage);
    this.state.lastSpeaker = 'user';
    this.notifyStateChange();

    // Generate friend response to user
    await this.generateFriendResponse(text);
  }

  private async generateFriendResponse(userText: string): Promise<void> {
    if (this.state.participants.length === 0) return;

    // Select a random friend to respond
    const randomIndex = Math.floor(Math.random() * this.state.participants.length);
    const selectedFriend = this.state.participants[randomIndex];

    try {
      // Generate response text using friend's personality
      const responseText = await this.generatePersonalityResponse(selectedFriend, userText);
      
      const friendMessage: ConversationMessage = {
        id: `friend-${selectedFriend.id}-${Date.now()}`,
        speaker: 'friend',
        friendId: selectedFriend.id,
        text: responseText,
        timestamp: new Date(),
      };

      this.state.messages.push(friendMessage);
      this.state.lastSpeaker = selectedFriend.name;
      this.notifyStateChange();

      // Generate voice for friend response
      await this.generateFriendVoice(friendMessage, selectedFriend);

      // Sometimes add host transition
      if (Math.random() < 0.3 && this.state.participants.length > 1) {
        setTimeout(() => this.generateHostTransition(), 2000);
      }

    } catch (error) {
      console.error('Failed to generate friend response:', error);
    }
  }

  private async generatePersonalityResponse(friend: Friend, userText: string): Promise<string> {
    const personalityPrompts = {
      cheerful: "Respond in an upbeat, positive, and enthusiastic way",
      romantic: "Respond in a warm, affectionate, and slightly flirtatious way", 
      unhinged: "Respond in a wild, unpredictable, and slightly chaotic way",
      sarcastic: "Respond with wit, sarcasm, and dry humor",
      wise: "Respond with thoughtful wisdom and deep insights",
      mysterious: "Respond in an enigmatic and intriguing way",
      aggressive: "Respond with intensity and boldness",
      gentle: "Respond with kindness and soft-spoken care",
      confident: "Respond with self-assurance and authority",
      playful: "Respond with humor and lighthearted teasing",
      melancholic: "Respond with thoughtful sadness and introspection",
      authoritative: "Respond with commanding presence and expertise"
    };

    const personalityInstruction = personalityPrompts[friend.personality as keyof typeof personalityPrompts] || "Respond naturally";
    
    // For now, generate contextual responses based on personality
    // In a real implementation, this would call an AI API
    const responses = this.generateContextualResponse(friend, userText, personalityInstruction);
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateContextualResponse(friend: Friend, userText: string, personalityInstruction: string): string[] {
    const lowerText = userText.toLowerCase();
    
    // Generate personality-appropriate responses based on common topics
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
      return this.getGreetingResponses(friend.personality);
    } else if (lowerText.includes('how are you') || lowerText.includes('how you doing')) {
      return this.getWellbeingResponses(friend.personality);
    } else if (lowerText.includes('weather') || lowerText.includes('day')) {
      return this.getWeatherResponses(friend.personality);
    } else {
      return this.getGeneralResponses(friend.personality, userText);
    }
  }

  private getGreetingResponses(personality: string): string[] {
    const responses: Record<string, string[]> = {
      cheerful: ["Hey there! So great to see you! How's your day going?", "Hi! I'm so excited to chat with you!"],
      romantic: ["Hello gorgeous... it's so nice to hear from you again.", "Hey there, beautiful. You've made my day brighter."],
      unhinged: ["YOOO! What's good?! Ready to cause some chaos?", "Heyyyy! Things just got interesting!"],
      sarcastic: ["Oh look who decided to show up. How gracious of you.", "Well, well, well... if it isn't my favorite human."],
      wise: ["Greetings, my friend. What wisdom shall we explore today?", "Hello. The universe has brought us together again."],
      mysterious: ["We meet again... as the shadows whispered we would.", "Hello... I've been expecting you."],
      aggressive: ["What's up?! Ready to tackle whatever comes our way?", "Hey! Let's make something happen today!"],
      gentle: ["Hello, dear. It's so lovely to hear from you.", "Hi there, sweetie. How can I brighten your day?"],
      confident: ["Hey! Great to see you. What can I help you conquer today?", "Hello! Ready to take on the world together?"],
      playful: ["Heyyyy troublemaker! What mischief are we getting into?", "Hi there! Ready for some fun?"],
      melancholic: ["Hello... it's nice to have some company in this quiet moment.", "Hi... the world feels a little less empty with you here."],
      authoritative: ["Good to see you. What matters shall we address today?", "Hello. I trust you're ready for our discussion."]
    };
    return responses[personality] || ["Hello! Nice to meet you."];
  }

  private getWellbeingResponses(personality: string): string[] {
    const responses: Record<string, string[]> = {
      cheerful: ["I'm doing amazing! Every day is such a gift! How about you?", "Fantastic! Life is so wonderful! What about you?"],
      romantic: ["I'm doing well, but better now that you're here.", "Much better now that I get to talk with you, darling."],
      unhinged: ["I'm VIBING! Chaos levels are optimal! How's your reality doing?", "Living my best chaotic life! What about your sanity?"],
      sarcastic: ["Oh, just living the dream... if the dream involves existential dread.", "Peachy. Really. Can't you tell from my enthusiasm?"],
      wise: ["I am well, flowing with the rhythm of existence. And your spirit?", "I find peace in each moment. How does life treat you?"],
      mysterious: ["I exist between shadows and light... but you intrigue me more.", "My state transcends simple words... what of yours?"],
      aggressive: ["I'm fired up and ready to conquer! How about you, champion?", "Doing great! Energy levels are through the roof!"],
      gentle: ["I'm doing well, thank you for asking so kindly.", "I'm peaceful and content. How are you feeling today?"],
      confident: ["Excellent as always. I hope you're matching my energy.", "Doing great! Confidence levels are at maximum."],
      playful: ["I'm bouncing off the walls! Ready to have some fun?", "Doing awesome! Got any games or jokes for me?"],
      melancholic: ["I'm... managing. Some days are harder than others.", "I'm here, which is something. How's your heart today?"],
      authoritative: ["I am operating at full capacity. Report your status.", "All systems nominal. What's your current situation?"]
    };
    return responses[personality] || ["I'm doing well, thank you."];
  }

  private getWeatherResponses(personality: string): string[] {
    const responses: Record<string, string[]> = {
      cheerful: ["Every day is beautiful when you have the right attitude!", "Weather's perfect for making memories!"],
      romantic: ["The weather's nice, but not as lovely as this conversation.", "Any weather feels perfect when I'm talking with you."],
      unhinged: ["Weather? I AM the storm! Bring on the chaos!", "Weather is just nature's mood swings! I respect that!"],
      sarcastic: ["Oh yes, let's discuss the weather. Riveting conversation starter.", "The weather? How delightfully predictable of us."],
      wise: ["Weather teaches us about life's constant changes and cycles.", "Each season brings its own lessons and beauty."],
      mysterious: ["The elements whisper secrets to those who listen...", "Weather... nature's way of setting the mood."],
      aggressive: ["Any weather is good weather for getting things done!", "Rain or shine, I'm ready to take on anything!"],
      gentle: ["I love how weather can be so peaceful and calming.", "There's something soothing about watching the weather change."],
      confident: ["I thrive in any weather conditions. Adaptability is key.", "Weather doesn't control my mood - I control my response to it."],
      playful: ["Weather's boring! Let's talk about something more exciting!", "Unless it's raining donuts, let's change topics!"],
      melancholic: ["Weather often mirrors how I feel inside...", "Gray skies sometimes match gray thoughts."],
      authoritative: ["Weather conditions are noted and assessed. Moving forward.", "Environmental factors have been evaluated."]
    };
    return responses[personality] || ["The weather's been interesting lately."];
  }

  private getGeneralResponses(personality: string, userText: string): string[] {
    const responses: Record<string, string[]> = {
      cheerful: [`That's so interesting! I love how you think about ${userText.slice(0, 20)}!`, "Wow, you always have such fascinating perspectives!"],
      romantic: [`You have such a beautiful way of expressing yourself...`, "Everything you say just draws me in more."],
      unhinged: [`WILD! That's absolutely chaotic and I'm here for it!`, "You just blew my mind! Reality is so strange!"],
      sarcastic: [`Oh how profound. Really groundbreaking stuff there.`, "Fascinating. Tell me more about this earth-shattering revelation."],
      wise: [`Your words carry deeper meaning than you realize.`, "There's wisdom in what you've shared. Let me reflect on this."],
      mysterious: [`Curious... that aligns with what I've foreseen.`, "You speak of things that dance at the edge of understanding."],
      aggressive: [`I like your energy! Let's dive deeper into this!`, "Now we're talking! That's the spirit I want to see!"],
      gentle: [`That's really thoughtful of you to share.`, "I appreciate you opening up about that."],
      confident: [`Excellent point. I respect that perspective.`, "You're absolutely right to think that way."],
      playful: [`Ooh, that's fun! Tell me more juicy details!`, "Haha, you're so entertaining! What else?"],
      melancholic: [`That resonates with something deep inside me...`, "I understand that feeling more than you might know."],
      authoritative: [`Your analysis is noted and will be considered.`, "That's a valid assessment. Proceeding with discussion."]
    };
    return responses[personality] || ["That's interesting. Tell me more."];
  }

  private async generateHostTransition(): Promise<void> {
    const transitions = [
      "Interesting perspective! What do others think?",
      "Love that energy! Who wants to jump in next?",
      "Great point! Let's hear from someone else.",
      "That's fascinating! Anyone else have thoughts?",
      "Nice! What's everyone else feeling about this?",
    ];

    const hostMessage: ConversationMessage = {
      id: `host-transition-${Date.now()}`,
      speaker: 'host',
      text: transitions[Math.floor(Math.random() * transitions.length)],
      timestamp: new Date(),
    };

    this.state.messages.push(hostMessage);
    this.notifyStateChange();

    await this.generateHostVoice(hostMessage);
  }

  private async generateFriendVoice(message: ConversationMessage, friend: Friend): Promise<void> {
    try {
      const response = await apiRequest("POST", "/api/generate-voice", {
        text: message.text,
        voiceId: friend.voiceId,
        stability: friend.stability,
        similarity: friend.similarity,
        playbackSpeed: 1.0,
        masterVolume: 1.0,
      });

      const data = await response.json();
      if (data.audioUrl) {
        message.voiceUrl = data.audioUrl;
        this.notifyStateChange();

        // Auto-play the voice
        await this.playMessageAudio(message);
      }
    } catch (error) {
      console.error('Failed to generate friend voice:', error);
    }
  }

  private async generateHostVoice(message: ConversationMessage): Promise<void> {
    try {
      // Use a neutral voice for host (you can configure this)
      const response = await apiRequest("POST", "/api/generate-voice", {
        text: message.text,
        voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah - neutral voice
        stability: 0.5,
        similarity: 0.75,
        playbackSpeed: 1.0,
        masterVolume: 1.0,
      });

      const data = await response.json();
      if (data.audioUrl) {
        message.voiceUrl = data.audioUrl;
        this.notifyStateChange();

        // Auto-play the voice
        await this.playMessageAudio(message);
      }
    } catch (error) {
      console.error('Failed to generate host voice:', error);
    }
  }

  public async playMessageAudio(message: ConversationMessage): Promise<void> {
    if (!message.voiceUrl || !this.audioContext) return;

    try {
      message.isPlaying = true;
      this.notifyStateChange();

      const audio = new Audio(message.voiceUrl);
      
      audio.onended = () => {
        message.isPlaying = false;
        this.notifyStateChange();
      };

      audio.onerror = () => {
        message.isPlaying = false;
        this.notifyStateChange();
      };

      await audio.play();
    } catch (error) {
      message.isPlaying = false;
      this.notifyStateChange();
      console.error('Failed to play message audio:', error);
    }
  }

  public stopConversation(): void {
    this.state.isActive = false;
    this.state.messages = [];
    this.state.lastSpeaker = undefined;
    this.notifyStateChange();
  }

  public getState(): ConversationState {
    return { ...this.state };
  }

  private notifyStateChange(): void {
    this.onStateChange({ ...this.state });
  }
}