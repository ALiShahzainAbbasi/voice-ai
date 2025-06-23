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

  constructor(friends: Friend[], onStateChange: (state: ConversationState) => void) {
    console.log("OpenAI ConversationManager constructor - participants:", friends.length);
    
    this.state = {
      messages: [],
      isActive: false,
      participants: friends,
      lastSpeaker: undefined
    };
    
    this.onStateChange = onStateChange;
    
    console.log("OpenAI conversation manager initialized with", friends.length, "friends");
  }

  public updateParticipants(friends: Friend[]) {
    this.state.participants = friends;
    this.notifyStateChange();
  }

  public async startConversation(): Promise<void> {
    this.state.isActive = true;
    this.conversationHistory = [];
    
    const participantNames = this.state.participants.map(f => f.name).join(", ");
    const hostMessage = `Hey everyone! Welcome to our voice chat. We have ${participantNames} here today. What's on your mind?`;
    
    console.log("Adding host message:", hostMessage);
    
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
    
    const prompt = `${lastSpeaker === 'user' ? 'The user just said' : `${lastSpeaker} just said`}: "${contextText}". Respond as ${friend.name} with specific details and concrete examples.`;

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
      }
    } catch (error) {
      console.error('Failed to generate host voice:', error);
    }
  }

  public async playMessageAudio(message: ConversationMessage): Promise<void> {
    if (!message.voiceUrl) return;

    try {
      message.isPlaying = true;
      this.notifyStateChange();

      const audio = new Audio(message.voiceUrl);
      
      audio.onended = () => {
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
    this.conversationHistory = [];
    this.stopAutonomousConversation();
    this.notifyStateChange();
  }

  private startAutonomousConversation(): void {
    if (this.isAutoConversationActive) return;
    
    this.isAutoConversationActive = true;
    console.log('Starting OpenAI autonomous conversation mode');
    
    // Start the conversation flow after 4 seconds to let any current audio finish
    setTimeout(() => {
      this.generateNextConversationTurn();
    }, 4000);
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
      // Wait for any current audio to finish to prevent overlap
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Double-check if conversation is still active after delay
      if (!this.isAutoConversationActive || !this.state.isActive) return;

      // Decide who speaks next: friend or host
      const shouldHostSpeak = Math.random() < 0.25; // 25% chance for host to speak
      
      if (shouldHostSpeak) {
        await this.generateAIHostComment();
      } else {
        await this.generateAIFriendConversation();
      }

      // Schedule next turn with longer delay to prevent overlap (7-12 seconds)
      const nextDelay = 7000 + Math.random() * 5000;
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
    
    const systemPrompt = `You are a friendly conversation host facilitating a chat between friends. Your job is to keep the conversation flowing naturally by making encouraging comments that reference specific shared experiences and memories.

CRITICAL RULES:
1. Reference specific places, events, and shared memories
2. Keep comments brief (1-2 sentences)
3. Use encouraging, positive tone
4. Connect what people are saying to shared experiences
5. Mention actual locations, names, dates, and specific events

Recent conversation:
${conversationContext}

Make a brief host comment that encourages the conversation and references specific shared experiences.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a host comment" }
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      const hostComment = response.choices[0].message.content?.trim() || 
        "This conversation is bringing back so many great memories from our time together!";

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