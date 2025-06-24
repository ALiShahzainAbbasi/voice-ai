import type { Friend } from "@shared/schema";

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

export class OpenAIConversationManager {
  private state: ConversationState;
  private onStateChange: (state: ConversationState) => void;
  private conversationTimer: NodeJS.Timeout | null = null;
  private isAutoConversationActive: boolean = false;
  private conversationHistory: string[] = [];
  private conversationContext: string = "";
  private historicalContext: string = "";

  constructor(friends: Friend[], onStateChange: (state: ConversationState) => void) {
    console.log("OpenAI ConversationManager constructor - participants:", friends.length);
    
    this.state = {
      messages: [],
      isActive: false,
      participants: [...friends],
      lastSpeaker: undefined
    };
    
    this.onStateChange = onStateChange;
    
    console.log("OpenAI conversation manager initialized with", friends.length, "friends");
    
    // Immediately notify state change to ensure UI updates
    this.notifyStateChange();
  }

  public updateParticipants(friends: Friend[]) {
    this.state.participants = [...friends];
    console.log("Updated participants in OpenAI conversation manager:", friends.length);
    this.notifyStateChange();
  }

  public setConversationContext(context: string) {
    this.conversationContext = context;
    console.log("Conversation context set:", context);
  }

  public setHistoricalContext(context: string) {
    this.historicalContext = context;
    console.log("Historical context set:", context.length, "characters");
  }

  public async startConversation(): Promise<void> {
    this.state.isActive = true;
    this.conversationHistory = [];
    
    const participantNames = this.state.participants.map(f => f.name).join(", ");
    
    // Create theme-appropriate host message based on conversation context
    let hostMessage = `Hey everyone! Welcome to our voice chat. We have ${participantNames} here today. What's on your mind?`;
    
    if (this.conversationContext) {
      if (this.conversationContext.includes("comfort") || this.conversationContext.includes("support")) {
        hostMessage = `Hi everyone. I know things can be tough sometimes, but we're all here for each other. ${participantNames}, let's share what's been on our hearts lately.`;
      } else if (this.conversationContext.includes("professional") || this.conversationContext.includes("business")) {
        hostMessage = `Good day, team. I'd like to welcome ${participantNames} to today's discussion. Let's dive into our agenda and share our thoughts professionally.`;
      } else if (this.conversationContext.includes("story") || this.conversationContext.includes("narrating")) {
        hostMessage = `Welcome, storytellers! ${participantNames}, I'm excited to hear the tales and experiences you have to share today.`;
      } else if (this.conversationContext.includes("friendly") || this.conversationContext.includes("casual")) {
        hostMessage = `Hey there, friends! ${participantNames}, it's so great to have you all here. Let's catch up and have some fun conversations!`;
      } else {
        hostMessage = `Hello everyone! ${participantNames}, let's explore this topic together: ${this.conversationContext}`;
      }
    }
    
    console.log("Adding theme-based host message:", hostMessage);
    
    const initialMessage: ConversationMessage = {
      id: `host-${Date.now()}`,
      speaker: 'host',
      text: hostMessage,
      timestamp: new Date(),
    };

    this.state.messages.push(initialMessage);
    this.state.lastSpeaker = 'Host';
    this.notifyStateChange();

    // Generate voice for host message
    this.generateHostVoice(initialMessage).catch(error => {
      console.error('Failed to generate host voice:', error);
    });

    // Start autonomous conversation after a brief delay
    this.startAutonomousConversation();
  }

  public async addUserMessage(text: string): Promise<void> {
    // Make sure conversation is active
    this.state.isActive = true;
    this.conversationHistory = [];
    
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    this.state.messages.push(userMessage);
    this.state.lastSpeaker = 'user';
    this.conversationHistory.push(`User: ${text.trim()}`);
    this.notifyStateChange();

    // Generate AI-powered friend response to user
    await this.generateAIFriendResponse(text);
    
    // Start autonomous conversation using the user's input as context
    if (!this.isAutoConversationActive) {
      this.startAutonomousConversation();
    }
  }

  private async generateAIFriendResponse(userText: string): Promise<void> {
    if (this.state.participants.length === 0) return;

    // Select a random friend to respond
    const randomIndex = Math.floor(Math.random() * this.state.participants.length);
    const selectedFriend = this.state.participants[randomIndex];

    try {
      const responseText = await this.generatePersonalityDrivenResponse(selectedFriend, userText, 'user');
      
      const friendMessage: ConversationMessage = {
        id: `friend-${selectedFriend.id}-${Date.now()}`,
        speaker: 'friend',
        friendId: selectedFriend.id,
        text: responseText,
        timestamp: new Date(),
      };

      this.state.messages.push(friendMessage);
      this.state.lastSpeaker = selectedFriend.name;
      this.conversationHistory.push(`${selectedFriend.name}: ${responseText}`);
      this.notifyStateChange();

      await this.generateFriendVoice(friendMessage, selectedFriend);
    } catch (error) {
      console.error('Failed to generate AI friend response:', error);
    }
  }

  private async generatePersonalityDrivenResponse(
    friend: Friend, 
    contextText: string, 
    lastSpeaker: string
  ): Promise<string> {
    const conversationContext = this.conversationHistory.slice(-10).join('\n');
    
    let prompt = `${lastSpeaker === 'user' ? 'The user just said' : `${lastSpeaker} just said`}: "${contextText}". Respond as ${friend.name} with a brief, concise response (1-2 sentences maximum).`;
    
    // Add historical context from messages/emails/posts
    if (this.historicalContext) {
      prompt = `HISTORICAL CONTEXT (reference previous interactions when relevant):
${this.historicalContext.slice(0, 1000)}

${prompt}

Use the historical context to create continuity and reference past conversations, shared experiences, or ongoing topics when appropriate.`;
    }
    
    // Add conversation template context if set
    if (this.conversationContext) {
      prompt = `CONVERSATION THEME: ${this.conversationContext}

${prompt}

CRITICAL: Your response as ${friend.name} must directly relate to and explore the conversation theme: "${this.conversationContext}". Share experiences, thoughts, or feelings that align with this theme while staying true to your personality.`;
    }

    try {
      const response = await fetch('/api/generate-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          personality: friend.personality,
          contextHistory: conversationContext
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.text || "That's really interesting. Tell me more about that.";
      } else {
        console.error('Conversation API error:', response.status);
        return "That's fascinating! I'd love to hear more details about that experience.";
      }
    } catch (error) {
      console.error('Failed to generate conversation:', error);
      return "That's fascinating! I'd love to hear more details about that experience.";
    }
  }



  private async generateFriendVoice(message: ConversationMessage, friend: Friend): Promise<void> {
    try {
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message.text,
          voiceId: friend.voiceId,
          stability: friend.stability,
          similarity: friend.similarity,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        message.voiceUrl = data.audioUrl;
        this.notifyStateChange();
        
        // Auto-play the voice in autonomous conversations and wait for completion
        setTimeout(async () => {
          await this.playMessageAudio(message);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to generate friend voice:', error);
    }
  }

  private async generateHostVoice(message: ConversationMessage): Promise<void> {
    try {
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message.text,
          voiceId: '9BWtsMINqrJLrRacOk9x', // Default Aria voice for host
          stability: 0.5,
          similarity: 0.75,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        message.voiceUrl = data.audioUrl;
        this.notifyStateChange();
        
        // Auto-play the voice in autonomous conversations and wait for completion
        setTimeout(async () => {
          await this.playMessageAudio(message);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to generate host voice:', error);
    }
  }

  public async playMessageAudio(message: ConversationMessage): Promise<void> {
    if (!message.voiceUrl) return;

    return new Promise((resolve) => {
      try {
        // Validate URL format
        if (!message.voiceUrl || (!message.voiceUrl.startsWith('http') && !message.voiceUrl.startsWith('data:'))) {
          console.warn('Invalid audio URL format for message:', message.id);
          resolve();
          return;
        }

        message.isPlaying = true;
        this.notifyStateChange();

        const audio = new Audio();
        
        audio.onended = () => {
          message.isPlaying = false;
          this.notifyStateChange();
          resolve();
        };

        audio.onerror = (error) => {
          message.isPlaying = false;
          this.notifyStateChange();
          console.warn('Audio playback error for message:', message.id);
          resolve();
        };

        audio.onloadstart = () => {
          console.log('Audio loading for message:', message.id);
        };

        // Set source after event listeners
        audio.src = message.voiceUrl;
        
        audio.play().catch((error) => {
          message.isPlaying = false;
          this.notifyStateChange();
          console.warn('Audio play failed for message:', message.id);
          resolve();
        });
      } catch (error) {
        message.isPlaying = false;
        this.notifyStateChange();
        console.warn('Audio setup failed for message:', message.id);
        resolve();
      }
    });
  }

  public stopConversation(): void {
    this.state.isActive = false;
    this.state.messages = [];
    this.state.lastSpeaker = undefined;
    this.conversationHistory = [];
    this.stopAutonomousConversation();
    this.notifyStateChange();
  }

  private startAutonomousConversation(): void {
    if (this.isAutoConversationActive) return;
    
    this.isAutoConversationActive = true;
    console.log('Starting OpenAI autonomous conversation mode');
    
    // Start the conversation flow after 2 seconds to let any current audio finish
    setTimeout(() => {
      this.generateNextConversationTurn();
    }, 2000);
  }

  private stopAutonomousConversation(): void {
    this.isAutoConversationActive = false;
    if (this.conversationTimer) {
      clearTimeout(this.conversationTimer);
      this.conversationTimer = null;
    }
    console.log('Stopped OpenAI autonomous conversation mode');
  }

  private async generateNextConversationTurn(): Promise<void> {
    if (!this.isAutoConversationActive || !this.state.isActive) return;

    try {
      // Wait for any current audio to finish
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Double-check if conversation is still active after delay
      if (!this.isAutoConversationActive || !this.state.isActive) return;

      // Decide who speaks next: friend or host
      const shouldHostSpeak = Math.random() < 0.25; // 25% chance for host to speak
      
      if (shouldHostSpeak) {
        await this.generateAIHostComment();
      } else {
        await this.generateAIFriendConversation();
      }

      // Schedule next turn with shorter delay (3.5-6 seconds)
      const nextDelay = 3500 + Math.random() * 2500;
      this.conversationTimer = setTimeout(() => {
        this.generateNextConversationTurn();
      }, nextDelay);

    } catch (error) {
      console.error('Error in OpenAI conversation turn:', error);
      // Retry after a longer delay
      this.conversationTimer = setTimeout(() => {
        this.generateNextConversationTurn();
      }, 10000);
    }
  }

  private async generateAIHostComment(): Promise<void> {
    const conversationContext = this.conversationHistory.slice(-8).join('\n');
    
    let systemPrompt = `You are a friendly conversation host facilitating a chat between friends. Your job is to keep the conversation flowing naturally by making encouraging comments that reference specific shared experiences and memories.

CRITICAL RULES:
1. Reference specific places, events, and shared memories
2. Keep comments VERY brief (1 sentence maximum)
3. Use encouraging, positive tone
4. Connect what people are saying to shared experiences
5. Mention actual locations, names, dates, and specific events

Recent conversation:
${conversationContext}

Make a very brief host comment (1 sentence only) that encourages the conversation and references specific shared experiences.`;

    // Add conversation template context if set
    if (this.conversationContext) {
      systemPrompt = `CONVERSATION THEME: ${this.conversationContext}

${systemPrompt}

IMPORTANT: Your host comments must relate to and support the conversation theme: "${this.conversationContext}". Encourage discussion around this theme while maintaining your encouraging, positive tone.`;
    }

    try {
      const response = await fetch('/api/generate-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: "Generate a brief host comment that encourages the conversation and references specific shared experiences.",
          personality: "cheerful", // Host is always encouraging
          contextHistory: conversationContext
        }),
      });

      let hostComment = "This conversation is bringing back so many great memories from our time together!";
      
      if (response.ok) {
        const data = await response.json();
        hostComment = data.text || hostComment;
      }

      const hostMessage: ConversationMessage = {
        id: `host-auto-${Date.now()}`,
        speaker: 'host',
        text: hostComment,
        timestamp: new Date(),
      };

      this.state.messages.push(hostMessage);
      this.state.lastSpeaker = 'Host';
      this.conversationHistory.push(`Host: ${hostComment}`);
      this.notifyStateChange();

      await this.generateHostVoice(hostMessage);
    } catch (error) {
      console.error('Failed to generate AI host comment:', error);
    }
  }

  private async generateAIFriendConversation(): Promise<void> {
    if (this.state.participants.length === 0) return;

    // Select a random friend to speak
    const speaker = this.state.participants[Math.floor(Math.random() * this.state.participants.length)];
    
    // Get the last message for context
    const lastMessage = this.state.messages.length > 0 ? this.state.messages[this.state.messages.length - 1] : undefined;
    const lastSpeaker = lastMessage ? (lastMessage.speaker === 'friend' ? 
      this.state.participants.find(f => f.id === lastMessage.friendId)?.name || 'someone' : 
      lastMessage.speaker) : 'someone';
    
    const contextText = lastMessage?.text || "starting a new conversation topic";
    
    const conversationText = await this.generatePersonalityDrivenResponse(speaker, contextText, lastSpeaker);
    
    const friendMessage: ConversationMessage = {
      id: `friend-auto-${speaker.id}-${Date.now()}`,
      speaker: 'friend',
      friendId: speaker.id,
      text: conversationText,
      timestamp: new Date(),
    };

    this.state.messages.push(friendMessage);
    this.state.lastSpeaker = speaker.name;
    this.conversationHistory.push(`${speaker.name}: ${conversationText}`);
    this.notifyStateChange();

    await this.generateFriendVoice(friendMessage, speaker);
  }

  public getState(): ConversationState {
    return { ...this.state };
  }

  private notifyStateChange(): void {
    this.onStateChange({ ...this.state });
  }
}