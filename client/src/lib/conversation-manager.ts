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
  private conversationTimer: NodeJS.Timeout | null = null;
  private isAutoConversationActive: boolean = false;
  private usedHostComments: Set<string> = new Set();
  private usedFriendContent: Map<number, Set<string>> = new Map();

  constructor(friends: Friend[], onStateChange: (state: ConversationState) => void) {
    this.state = {
      messages: [],
      isActive: false,
      participants: friends,
    };
    this.onStateChange = onStateChange;
    this.initializeAudioContext();
    console.log('ConversationManager constructor - participants:', friends.length);
    // Immediately notify about initial state
    this.notifyStateChange();
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
    console.log('Starting conversation with participants:', this.state.participants.length);
    
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

    console.log('Adding host message:', hostMessage.text);
    this.state.messages.push(hostMessage);
    this.notifyStateChange();

    // Generate host voice for greeting (don't await to avoid blocking)
    this.generateHostVoice(hostMessage).catch(error => {
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
    this.notifyStateChange();

    // Generate friend response to user
    await this.generateFriendResponse(text);
    
    // Start autonomous conversation after user input
    if (!this.isAutoConversationActive) {
      this.startAutonomousConversation();
    }
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
    
    // Get the last message for context
    const lastMessage = this.state.messages.length > 0 ? this.state.messages[this.state.messages.length - 1] : undefined;
    
    // Generate contextual responses based on personality and recent conversation
    const responses = this.generateContextualResponse(friend, userText, lastMessage);
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateContextualResponse(friend: Friend, userText: string, lastMessage?: ConversationMessage): string[] {
    const lowerText = userText.toLowerCase();
    
    // If there's a recent message, try to respond contextually to it
    if (lastMessage && lastMessage.speaker !== 'friend') {
      return this.getContextualResponses(friend.personality, lastMessage.text);
    }
    
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

  private getContextualResponses(personality: string, previousText: string): string[] {
    const lowerText = previousText.toLowerCase();
    
    // Generate specific contextual responses based on the actual content
    const responses: Record<string, string[]> = {
      cheerful: [
        "That reminds me of when we went to that amazing concert at the amphitheater last summer! The energy was just like what you're describing.",
        "Oh my gosh, yes! That's exactly how I felt when we discovered that hidden coffee shop on Maple Street. Life is full of these perfect little moments!",
        "You know what? Your enthusiasm is contagious! It's making me think about that road trip we took to the coast - remember how excited we got about everything?",
        "That's so true! It reminds me of something my grandmother used to say when we'd visit her farm in Iowa every summer."
      ],
      romantic: [
        "Your words just transported me back to that evening we spent watching the meteor shower from the rooftop. The way you see the world is so beautiful.",
        "That's exactly how I felt during our first dance at my cousin's wedding in Savannah. You have this way of making everything feel magical.",
        "The passion in your voice reminds me of when you told me about your dreams during that long walk through the botanical gardens last spring.",
        "That sentiment is so beautiful... it's like that poem you shared with me from your literature class at university."
      ],
      sarcastic: [
        "Oh right, because that worked out so well the last time we tried something like that. Remember the great camping disaster of 2022?",
        "Uh-huh, sure. And I suppose next you'll tell me that your 'brilliant' navigation skills from our trip to Seattle were actually helpful too?",
        "That's rich, coming from someone who thought they could fix the garbage disposal with duct tape and 'positive thinking.'",
        "Oh absolutely, because your track record with these kinds of ideas is just stellar. Like that time you convinced us to try that 'authentic' food truck."
      ],
      wise: [
        "That perspective reminds me of the philosophy course I took at State University with Professor Chen. She always said wisdom comes from reflection on experience.",
        "Your insight echoes something I learned during my meditation retreat in Colorado. Sometimes the most profound truths are found in simple observations.",
        "That's very perceptive. It brings to mind a conversation I had with my mentor, Dr. Williams, about the nature of human connection and understanding.",
        "You've touched on something important there. It reminds me of a discussion we had at that book club meeting about 'Man's Search for Meaning.'"
      ],
      unhinged: [
        "WAIT! That just reminded me of that absolutely chaotic New Year's Eve party at Danny's house where everything went sideways but somehow became legendary!",
        "OH MY GOD YES! That's giving me the same energy as when we accidentally ended up at that underground karaoke competition in Chinatown!",
        "DUDE! That's exactly the vibe from that time we got snowed in at the cabin and ended up creating that epic blanket fort civilization!",
        "YESSS! That energy is just like when we spontaneously decided to drive to Vegas for Jessica's birthday and everything went beautifully wrong!"
      ]
    };

    // Check for specific topics and respond accordingly
    if (lowerText.includes('sad') || lowerText.includes('down') || lowerText.includes('upset')) {
      return this.getComfortingResponses(personality);
    } else if (lowerText.includes('excited') || lowerText.includes('happy') || lowerText.includes('great')) {
      return this.getEnthusiasticResponses(personality);
    } else if (lowerText.includes('question') || lowerText.includes('wondering') || lowerText.includes('think')) {
      return this.getThoughtfulResponses(personality);
    }
    
    return responses[personality] || [
      "That's really interesting. I hadn't thought about it that way before.",
      "You make a valid point there. It's given me something to consider.",
      "I appreciate you sharing that perspective with me."
    ];
  }

  private getComfortingResponses(personality: string): string[] {
    const responses: Record<string, string[]> = {
      cheerful: ["Hey, it's okay to feel down sometimes! Tomorrow is a new day full of possibilities!"],
      romantic: ["Oh darling, let me be here for you. Your heart is safe with me."],
      gentle: ["I'm here with you. Sometimes we just need someone to sit with us in these moments."],
      wise: ["Pain is part of the human experience. It teaches us compassion and strength."],
      sarcastic: ["Well, that's life for you. At least you're not alone in feeling miserable."]
    };
    return responses[personality] || ["I hear you. That sounds really difficult."];
  }

  private getEnthusiasticResponses(personality: string): string[] {
    const responses: Record<string, string[]> = {
      cheerful: ["YES! I love your enthusiasm! It's absolutely contagious!"],
      romantic: ["Your joy is radiant... it makes my heart sing to see you so happy."],
      unhinged: ["YESSS! That energy is ELECTRIC! I'm vibrating with excitement!"],
      confident: ["Now THAT'S what I'm talking about! That's the spirit!"],
      playful: ["Ooh, I love when you get all excited like this! Tell me more!"]
    };
    return responses[personality] || ["That's wonderful! I love seeing you so happy."];
  }

  private getThoughtfulResponses(personality: string): string[] {
    const responses: Record<string, string[]> = {
      wise: ["That's a profound question. Let us ponder this together..."],
      mysterious: ["Interesting... the answer you seek may not be what you expect..."],
      gentle: ["Those are such thoughtful questions. You have a curious mind."],
      authoritative: ["Good question. Here's what I think based on my experience..."],
      melancholic: ["Sometimes the best questions are the ones without easy answers..."]
    };
    return responses[personality] || ["That's a really good question. Let me think about that."];
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
      // Use a neutral voice for host
      const response = await apiRequest("POST", "/api/generate-voice", {
        text: message.text,
        voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah - neutral voice
        stability: 0.5,
        similarity: 0.75,
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
    this.stopAutonomousConversation();
    this.notifyStateChange();
  }

  private startAutonomousConversation(): void {
    if (this.isAutoConversationActive) return;
    
    this.isAutoConversationActive = true;
    console.log('Starting autonomous conversation mode');
    
    // Start the conversation flow after 3 seconds to let host greeting play
    setTimeout(() => {
      this.generateNextConversationTurn();
    }, 3000);
  }

  private stopAutonomousConversation(): void {
    this.isAutoConversationActive = false;
    if (this.conversationTimer) {
      clearTimeout(this.conversationTimer);
      this.conversationTimer = null;
    }
    console.log('Stopped autonomous conversation mode');
  }

  private async generateNextConversationTurn(): Promise<void> {
    if (!this.isAutoConversationActive || !this.state.isActive) return;

    try {
      // Decide who speaks next: friend or host
      const shouldHostSpeak = Math.random() < 0.3; // 30% chance for host to speak
      
      if (shouldHostSpeak) {
        await this.generateHostComment();
      } else {
        await this.generateFriendConversation();
      }

      // Schedule next turn (3-8 seconds later)
      const nextDelay = 3000 + Math.random() * 5000;
      this.conversationTimer = setTimeout(() => {
        this.generateNextConversationTurn();
      }, nextDelay);

    } catch (error) {
      console.error('Error in autonomous conversation:', error);
      // Retry after a longer delay
      this.conversationTimer = setTimeout(() => {
        this.generateNextConversationTurn();
      }, 5000);
    }
  }

  private async generateHostComment(): Promise<void> {
    const hostComments = [
      "That's a great point! What do you all think?",
      "Interesting perspective! Anyone else want to weigh in?",
      "I love the energy here! Keep it going!",
      "Fascinating discussion! Let's hear more thoughts.",
      "Great conversation, everyone! What else is on your minds?",
      "You're all so insightful! This is wonderful to hear.",
      "That brings up an interesting question...",
      "I'm curious to hear what others think about this.",
      "What a thoughtful group! Please, continue.",
      "This is exactly the kind of discussion I hoped for!",
      "Wonderful insights from everyone today!",
      "I'm really enjoying hearing all your perspectives.",
      "Such thoughtful contributions from the group!",
      "Let's keep this momentum going, shall we?",
      "You've all given me so much to think about.",
      "The diversity of thoughts here is amazing!",
      "Please, don't let me interrupt - continue!",
      "This conversation is flowing beautifully.",
      "Each of you brings such unique wisdom.",
      "I'm grateful for this open dialogue we're having.",
      "The depth of your thoughts continues to amaze me.",
      "I appreciate how respectfully you're all engaging.",
      "Your different viewpoints create such rich dialogue.",
      "This is the kind of conversation that stays with you.",
      "I'm learning so much from each of your perspectives.",
      "The way you build on each other's ideas is beautiful.",
      "Thank you for creating such a welcoming space here.",
      "Your authenticity makes this conversation special.",
      "I'm honored to facilitate this meaningful exchange.",
      "The wisdom you're sharing deserves to be heard."
    ];

    // Filter out already used comments and recently used phrases
    const recentMessages = this.state.messages.slice(-10);
    const recentTexts = new Set(recentMessages.map(m => m.text));
    
    const availableComments = hostComments.filter(comment => 
      !this.usedHostComments.has(comment) && !recentTexts.has(comment)
    );
    
    // Reset if all comments have been used
    if (availableComments.length === 0) {
      this.usedHostComments.clear();
      availableComments.push(...hostComments.filter(comment => !recentTexts.has(comment)));
    }

    // If still no available comments, skip this turn
    if (availableComments.length === 0) return;

    const selectedComment = availableComments[Math.floor(Math.random() * availableComments.length)];
    this.usedHostComments.add(selectedComment);

    const hostMessage: ConversationMessage = {
      id: `host-auto-${Date.now()}`,
      speaker: 'host',
      text: selectedComment,
      timestamp: new Date(),
    };

    this.state.messages.push(hostMessage);
    this.state.lastSpeaker = 'Host';
    this.notifyStateChange();

    await this.generateHostVoice(hostMessage);
  }

  private async generateFriendConversation(): Promise<void> {
    if (this.state.participants.length === 0) return;

    // Select a random friend to speak
    const speaker = this.state.participants[Math.floor(Math.random() * this.state.participants.length)];
    
    // Get contextual content based on recent conversation
    const lastMessage = this.state.messages.length > 0 ? this.state.messages[this.state.messages.length - 1] : undefined;
    const conversationText = lastMessage && lastMessage.speaker !== 'friend' 
      ? this.generateContextualConversationResponse(speaker, lastMessage)
      : this.generateConversationContent(speaker);
    
    const friendMessage: ConversationMessage = {
      id: `friend-auto-${speaker.id}-${Date.now()}`,
      speaker: 'friend',
      friendId: speaker.id,
      text: conversationText,
      timestamp: new Date(),
    };

    this.state.messages.push(friendMessage);
    this.state.lastSpeaker = speaker.name;
    this.notifyStateChange();

    await this.generateFriendVoice(friendMessage, speaker);
  }

  private generateContextualConversationResponse(friend: Friend, lastMessage: ConversationMessage): string {
    const responses = this.getContextualResponses(friend.personality, lastMessage.text);
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateConversationContent(friend: Friend): string {
    // Initialize friend's used content set if not exists
    if (!this.usedFriendContent.has(friend.id)) {
      this.usedFriendContent.set(friend.id, new Set());
    }

    // Check recent messages to avoid repetition
    const recentMessages = this.state.messages.slice(-15);
    const recentTexts = new Set(recentMessages.map(m => m.text));

    const conversationTopics = {
      cheerful: [
        "Remember that time we went to Sarah's birthday party last March? I still can't believe she had that karaoke machine in her backyard!",
        "I just got back from that new farmers market on 5th Street. They have the most incredible honey I've ever tasted - reminded me of that trip we took to Vermont in 2019.",
        "Did you see the email about our college reunion next summer? It's hard to believe it's been 8 years since we graduated from State University.",
        "I ran into Mike from our old marketing team yesterday at Starbucks. He's doing freelance work now and seems really happy about it.",
        "That concert we went to at Red Rocks last August was absolutely incredible. I still get goosebumps thinking about when they played our favorite song during the encore.",
        "My sister just got engaged to that guy Tom we met at the barbecue in July. They're planning a destination wedding in Costa Rica next spring!",
        "I finally finished reading that book you recommended - 'Atomic Habits' by James Clear. You were right, it really did change how I think about productivity.",
        "The weather reminds me of that perfect day we spent at the beach house in Outer Banks. Remember when we found those sand dollars and built that epic sandcastle?",
        "I just booked my flight for Christmas - can't wait to see everyone at Mom's house. Are you still planning to drive down from Chicago?",
        "That new Thai restaurant on Elm Street is amazing! The pad thai tastes just like the one we had in Bangkok during our backpacking trip.",
        "I saw our old professor Dr. Martinez at the grocery store. She's retiring next semester after 30 years of teaching psychology at the university.",
        "Remember when we used to stay up until 3 AM playing board games in college? I found our old Settlers of Catan set in the closet yesterday."
      ],
      romantic: [
        "That dinner we had at Giovanni's last Valentine's Day was perfect. The way the candlelight reflected in your eyes during dessert... I'll never forget that moment.",
        "I still have the ticket stub from our first movie date - we saw 'The Notebook' at the old Palace Theater downtown. You cried during the ending and I knew I was falling for you.",
        "Remember our weekend getaway to that bed and breakfast in Napa Valley? Walking through the vineyards at sunset, your hand in mine... pure magic.",
        "I found that love letter you wrote me for our anniversary last year. Reading it again still gives me butterflies, especially the part about our future together.",
        "That slow dance we shared at Emma's wedding to 'At Last' by Etta James... I could have stayed in your arms forever on that dance floor.",
        "The way you looked at me when I surprised you with those roses at your office last month - your colleagues still talk about how romantic it was.",
        "Our first kiss under the cherry blossoms in Central Park during spring break... every time I see those flowers bloom, I think of that perfect April afternoon.",
        "I love how we always find each other's hands during movies, even in the dark. It's like our hearts just naturally seek that connection."
      ],
      unhinged: [
        "Remember when we tried to build that treehouse behind Jake's place in 2018? I still can't believe we thought duct tape would hold a whole platform together!",
        "I just realized - we've been friends for 6 years and I JUST found out you put pineapple on pizza! How did this never come up during our weekly Friday night dinners?",
        "That time we got lost driving to Dave's wedding in Portland and ended up at that weird roadside attraction with the giant rubber duck... best wrong turn EVER!",
        "I still have nightmares about that camping trip where you convinced us to eat those 'totally safe' mushrooms you found. We spent three hours convinced the trees were speaking French!",
        "Remember our failed business idea from college - selling custom fortune cookies with inside jokes? We made exactly $12 and ate about $200 worth of cookies ourselves.",
        "That epic game night at my apartment last winter when the power went out and we played charades by candlelight until 4 AM... chaos but magical chaos!",
        "I just found our old group chat from that disastrous ski trip to Aspen. 847 messages in one day, mostly about how none of us could actually ski!"
      ],
      sarcastic: [
        "Oh great, another story about your 'life-changing' experience at that meditation retreat in Sedona. Because the first five times weren't enough.",
        "Let me guess - you're about to tell us how that overpriced smoothie from Whole Foods 'transformed your relationship with nutrition'?",
        "Wow, Kevin got promoted again? What a surprise. I'm sure his connections to the CEO's golf buddy had nothing to do with it.",
        "That inspirational quote you posted on Instagram yesterday really changed my life. Said no one ever, except apparently your 47 likes.",
        "Remember when we all pretended to enjoy Rachel's vegan potluck last month? Good times. My taste buds are still recovering.",
        "Oh, you discovered a new coffee shop and it's 'totally going to be your new regular spot'? Just like the other twelve you've said that about.",
        "Let me just mark my calendar for your next 'spontaneous' adventure that you've been planning for three weeks.",
        "That time you insisted we take the 'scenic route' to the beach and we got lost for two hours? Peak navigation skills right there."
      ],
      wise: [
        "In my experience, the most profound conversations often happen when we least expect them.",
        "There's an old saying: 'The quality of our conversations determines the quality of our relationships.'",
        "I've learned that listening is often more valuable than speaking. We learn so much from each other.",
        "Life has taught me that every person we meet has something valuable to teach us, if we're open to learning."
      ],
      mysterious: [
        "Some secrets are best shared in whispers... but perhaps this is one worth speaking aloud.",
        "I sense there are deeper currents flowing beneath this conversation than what appears on the surface.",
        "The shadows of our thoughts often reveal more truth than the light of our words.",
        "There are things I could tell you... but some knowledge comes only when you're ready to receive it."
      ],
      aggressive: [
        "You know what I think? We need to stop beating around the bush and get to the real issues!",
        "I'm tired of small talk! Let's discuss something that actually matters and makes a difference!",
        "Why do people always dance around important topics? Let's be direct and honest for once!",
        "We have the power to change things if we stop being passive and start taking action!"
      ],
      gentle: [
        "I hope everyone is feeling comfortable and welcome in this space we've created together.",
        "Please, take your time sharing. There's no rush, and every voice here is valued and important.",
        "I find such peace in conversations like this, where we can simply be ourselves without judgment.",
        "Sometimes the softest words carry the most meaning. I'm grateful we can speak so openly here."
      ],
      confident: [
        "I believe we're exactly where we need to be right now, having exactly the conversation we're meant to have.",
        "You know, I've always found that the best discussions happen when people speak with genuine conviction.",
        "I'm confident that each of us brings something unique and valuable to this conversation.",
        "There's real power in authentic dialogue. We're creating something meaningful here together."
      ],
      playful: [
        "Okay, okay, but can we talk about something fun? Like... what superpower would you choose and why?",
        "You know what we need? More laughter in this conversation! Life's too short to be serious all the time!",
        "I dare someone to share their most embarrassing moment. I'll go first if you want!",
        "Let's play a game! Everyone has to share one totally random fact about themselves!"
      ],
      melancholic: [
        "Sometimes I wonder if we're all just searching for connection in this vast, lonely universe.",
        "There's a bittersweet beauty in conversations like this... fleeting moments of understanding.",
        "I often think about how we're all carrying our own invisible burdens, yet we still find ways to reach out.",
        "The sadness I feel isn't despair - it's more like a deep appreciation for the fragility of these moments."
      ],
      authoritative: [
        "Based on my experience, the most productive conversations follow a clear structure and purpose.",
        "I believe it's important that we establish some ground rules for this discussion moving forward.",
        "Let me share some insights I've gained over the years about effective communication and dialogue.",
        "The key to meaningful conversation is maintaining focus and ensuring everyone contributes constructively."
      ]
    };

    const personalityTopics = conversationTopics[friend.personality as keyof typeof conversationTopics] || conversationTopics.cheerful;
    const usedContent = this.usedFriendContent.get(friend.id)!;
    
    // Filter out already used content AND recently said phrases
    const availableContent = personalityTopics.filter(content => 
      !usedContent.has(content) && !recentTexts.has(content)
    );
    
    // Reset if all content has been used, but still avoid recent messages
    if (availableContent.length === 0) {
      usedContent.clear();
      const resetContent = personalityTopics.filter(content => !recentTexts.has(content));
      if (resetContent.length > 0) {
        availableContent.push(...resetContent);
      } else {
        // In extreme case, just use oldest content
        availableContent.push(...personalityTopics.slice(0, 3));
      }
    }

    // If still no content, return a generic response
    if (availableContent.length === 0) {
      return `That's really interesting. I'd love to hear more about that.`;
    }

    const selectedContent = availableContent[Math.floor(Math.random() * availableContent.length)];
    usedContent.add(selectedContent);
    
    return selectedContent;
  }

  public getState(): ConversationState {
    return { ...this.state };
  }

  private notifyStateChange(): void {
    this.onStateChange({ ...this.state });
  }
}