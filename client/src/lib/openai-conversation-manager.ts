import OpenAI from "openai";
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
  private openai: OpenAI;
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
    
    // Initialize OpenAI - we'll make API calls through our backend to keep the key secure
    this.openai = new OpenAI({ 
      apiKey: "placeholder", // API calls will go through our backend
      baseURL: "/api/openai", // Route to our backend OpenAI proxy
      dangerouslyAllowBrowser: true 
    });
    
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
    
    const personalityPrompt = this.buildPersonalityPrompt(friend);
    
    const systemPrompt = `You are ${friend.name}, a ${friend.personality} person. ${personalityPrompt}

CRITICAL RULES:
1. Always respond with specific details like dates, places, names, and shared experiences
2. Reference concrete memories and real-life scenarios
3. Never use generic platitudes or vague statements
4. Keep responses conversational and authentic (2-3 sentences max)
5. Build on what the previous speaker said with specific examples
6. Mention actual locations, people's names, specific dates/times

Current conversation context:
${conversationContext}

${lastSpeaker === 'user' ? 'The user just said' : `${lastSpeaker} just said`}: "${contextText}"

Respond as ${friend.name} with specific details and concrete examples.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextText }
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      return response.choices[0].message.content?.trim() || "That's really interesting. Tell me more about that.";
    } catch (error) {
      console.error('OpenAI API error:', error);
      return "That's fascinating! I'd love to hear more details about that experience.";
    }
  }

  private buildPersonalityPrompt(friend: Friend): string {
    const personalityDescriptions = {
      cheerful: "You're always optimistic and energetic. You love sharing positive experiences from your life like weekend adventures, fun events you attended, and exciting plans you have coming up.",
      romantic: "You're deeply emotional and value meaningful connections. You often reference romantic movies you've seen, beautiful places you've visited with loved ones, and heartfelt moments you've experienced.",
      unhinged: "You're spontaneous and unpredictable. You tell wild stories about crazy things you've done, unexpected adventures you've had, and impulsive decisions you've made.",
      sarcastic: "You're witty and often use humor to make your point. You reference funny situations you've witnessed, ironic events that happened to you, and amusing observations about life.",
      wise: "You're thoughtful and philosophical. You often reference books you've read, life lessons you've learned from specific experiences, and insights gained from your past.",
      gentle: "You're caring and compassionate. You talk about times you've helped others, peaceful moments you've enjoyed, and ways you've supported friends and family.",
      mysterious: "You're enigmatic and intriguing. You hint at unusual experiences you've had, strange coincidences in your life, and unexplained events you've witnessed.",
      aggressive: "You're direct and assertive. You reference times you've stood up for yourself or others, challenges you've overcome, and strong opinions about specific situations.",
      confident: "You're self-assured and ambitious. You talk about goals you've achieved, challenges you've conquered, and successes you've had in specific endeavors.",
      playful: "You're fun-loving and mischievous. You reference games you've played, pranks you've pulled, silly situations you've been in, and lighthearted moments you've shared.",
      melancholic: "You're contemplative and sometimes sad. You reflect on bittersweet memories, losses you've experienced, and poignant moments that have shaped you.",
      authoritative: "You're knowledgeable and take charge. You reference your expertise in specific areas, leadership experiences you've had, and situations where you've guided others."
    };

    return personalityDescriptions[friend.personality as keyof typeof personalityDescriptions] || personalityDescriptions.cheerful;
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