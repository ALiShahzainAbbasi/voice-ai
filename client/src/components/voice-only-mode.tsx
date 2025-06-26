import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OpenAIConversationManager, type ConversationState, type ConversationMessage } from "@/lib/openai-conversation-manager";
import type { Friend } from "@shared/schema";

interface VoiceOnlyModeProps {
  friends: Friend[];
  onExitMode: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceOnlyMode({ friends, onExitMode }: VoiceOnlyModeProps) {
  const [conversationManager, setConversationManager] = useState<OpenAIConversationManager | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>({
    messages: [],
    isActive: false,
    participants: [],
    lastSpeaker: undefined
  });
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string>("");
  const [lastUserInput, setLastUserInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interruptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize conversation manager
  useEffect(() => {
    if (friends.length > 0) {
      const manager = new OpenAIConversationManager(friends, setConversationState);
      setConversationManager(manager);
      
      // Auto-start conversation
      manager.startConversation();
      
      console.log("Voice Only Mode initialized with", friends.length, "friends");
    }
  }, [friends]);

  // Initialize continuous speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        console.log("Voice Only Mode: Continuous listening started");
      };
      
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        
        if (event.results[current].isFinal) {
          handleSpeechInput(transcript.trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'no-speech') {
          // Restart listening if no speech detected
          setTimeout(() => {
            if (recognitionRef.current && !isListening) {
              startListening();
            }
          }, 1000);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        // Auto-restart listening unless manually stopped or muted
        if (recognitionRef.current && !isMuted) {
          setTimeout(() => {
            if (!isProcessing) {
              startListening();
            }
          }, 1000);
        }
      };
      
      recognitionRef.current = recognition;
      
      // Auto-start listening
      startListening();
    } else {
      console.warn("Speech recognition not supported in this browser");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (interruptionTimeoutRef.current) {
        clearTimeout(interruptionTimeoutRef.current);
      }
    };
  }, []);

  // Monitor conversation messages for current speaker
  useEffect(() => {
    const lastMessage = conversationState.messages[conversationState.messages.length - 1];
    if (lastMessage) {
      if (lastMessage.speaker === 'friend' && lastMessage.friendId) {
        const friend = friends.find(f => f.id === lastMessage.friendId);
        setCurrentSpeaker(friend?.name || "Friend");
      } else if (lastMessage.speaker === 'host') {
        setCurrentSpeaker("Host");
      } else if (lastMessage.speaker === 'user') {
        setCurrentSpeaker("You");
      }
    }
  }, [conversationState.messages, friends]);

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isMuted) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        const err = error as any;
        if (err.name === 'InvalidStateError') {
          // Recognition is already running, just update state
          setIsListening(true);
        } else {
          console.error("Failed to start speech recognition:", error);
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleSpeechInput = async (transcript: string) => {
    if (!transcript || transcript.length < 3) return;
    
    console.log("Voice Only Mode: User said:", transcript);
    setLastUserInput(transcript);
    setIsProcessing(true);
    
    // Stop any current audio playback (interruption)
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    
    // Interrupt conversation flow and prioritize user input
    if (conversationManager) {
      // Stop autonomous conversation
      conversationManager.stopConversation();
      
      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Add user message and generate immediate response
      await conversationManager.addUserMessage(transcript);
      
      // Restart conversation with new context after user input
      setTimeout(() => {
        if (conversationManager && !isProcessing) {
          conversationManager.startConversation();
        }
      }, 3000);
    }
    
    setIsProcessing(false);
    
    // Clear any pending timers
    if (interruptionTimeoutRef.current) {
      clearTimeout(interruptionTimeoutRef.current);
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handlePlayMessage = async (message: ConversationMessage) => {
    if (!message.voiceUrl || isMuted) return;
    
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      
      const audio = new Audio(message.voiceUrl);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        currentAudioRef.current = null;
      };
      
      await audio.play();
    } catch (error) {
      console.error("Failed to play message audio:", error);
    }
  };

  // Auto-play new messages
  useEffect(() => {
    const lastMessage = conversationState.messages[conversationState.messages.length - 1];
    if (lastMessage && lastMessage.voiceUrl && lastMessage.speaker !== 'user') {
      handlePlayMessage(lastMessage);
    }
  }, [conversationState.messages, isMuted]);

  const currentMessage = conversationState.messages[conversationState.messages.length - 1];
  const conversationActive = conversationState.isActive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExitMode}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit Voice Mode
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className={`text-white hover:bg-white/20 ${isMuted ? 'bg-red-500/30' : ''}`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* Status Display */}
        <div className="text-center space-y-4">
          <div className="text-white/80 text-lg">
            {friends.length} Virtual Friends Ready
          </div>
          
          {isProcessing && (
            <div className="text-yellow-400 text-sm">
              Processing your request...
            </div>
          )}
          
          {currentSpeaker && !isProcessing && (
            <div className="text-white text-xl font-medium">
              {currentSpeaker === "You" ? "You spoke" : `${currentSpeaker} is speaking`}
            </div>
          )}
          
          {!conversationActive && !isProcessing && (
            <div className="text-white/60 text-sm">
              Starting conversation...
            </div>
          )}
        </div>

        {/* Voice Visualization */}
        <div className="relative">
          <div className={`w-32 h-32 rounded-full border-4 border-white/30 flex items-center justify-center transition-all duration-300 ${
            isListening && !isMuted ? 'bg-green-500/30 border-green-400 scale-110' : 
            isMuted ? 'bg-red-500/30 border-red-400' : 
            'bg-white/10'
          }`}>
            {isMuted ? (
              <MicOff className="w-12 h-12 text-red-400" />
            ) : (
              <Mic className={`w-12 h-12 transition-colors duration-300 ${
                isListening ? 'text-green-400' : 'text-white/70'
              }`} />
            )}
          </div>
          
          {/* Listening Animation */}
          {isListening && !isMuted && (
            <div className="absolute inset-0 rounded-full border-4 border-green-400/50 animate-ping"></div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center space-y-2 max-w-md">
          <div className="text-white/90 text-lg font-medium">
            {isMuted ? "Voice is muted" : "Listening continuously..."}
          </div>
          
          {!isMuted && (
            <div className="text-white/60 text-sm">
              Speak naturally to start or interrupt conversations.
              Your virtual friends will respond automatically.
            </div>
          )}
          
          {lastUserInput && (
            <div className="text-blue-300 text-sm italic mt-4">
              Last: "{lastUserInput}"
            </div>
          )}
        </div>

        {/* Current Message Preview */}
        {currentMessage && (
          <Card className="bg-black/30 backdrop-blur-sm border-white/20 max-w-md w-full">
            <CardContent className="p-4">
              <div className="text-white/80 text-sm mb-1">
                {currentMessage.speaker === 'friend' ? 
                  friends.find(f => f.id === currentMessage.friendId)?.name || "Friend" :
                  currentMessage.speaker === 'host' ? "Host" : "You"
                }
              </div>
              <div className="text-white text-sm">
                {currentMessage.text}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-black/20 backdrop-blur-sm text-center">
        <div className="text-white/50 text-xs">
          Voice Only Mode • {isListening && !isMuted ? "Listening" : isMuted ? "Muted" : "Ready"}
        </div>
      </div>
    </div>
  );
}