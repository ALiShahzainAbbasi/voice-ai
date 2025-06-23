import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, MicOff, MessageCircle, Users, Volume2 } from "lucide-react";
import type { Friend } from "@shared/schema";
import { ConversationDisplay } from "@/components/conversation-display";
import { SpeechInput } from "@/components/speech-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { OpenAIConversationManager, type ConversationState } from "@/lib/openai-conversation-manager";

export default function VoiceOnly() {
  const [conversationManager, setConversationManager] = useState<OpenAIConversationManager | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>({
    messages: [],
    isActive: false,
    participants: [],
    lastSpeaker: undefined
  });
  const [textInput, setTextInput] = useState("");

  const { data: friends = [], isLoading } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
  });

  // Initialize conversation manager when friends data changes
  useEffect(() => {
    console.log("VoiceOnly useEffect - Friends data:", friends.length, "friends");
    
    if (friends.length > 0) {
      // Always create a new manager to ensure clean state
      if (conversationManager) {
        conversationManager.stopConversation();
      }
      
      console.log("Creating fresh voice-only conversation manager with friends:", friends.map(f => f.name));
      const manager = new OpenAIConversationManager(friends, (newState) => {
        console.log("Voice-only conversation state updated - participants:", newState.participants.length);
        setConversationState(newState);
      });
      setConversationManager(manager);
    } else {
      console.log("No friends available - clearing voice-only conversation manager");
      if (conversationManager) {
        conversationManager.stopConversation();
      }
      setConversationManager(null);
    }
  }, [friends]);

  const handleSpeechInput = async (speechText: string) => {
    if (!conversationManager || !speechText.trim()) return;

    console.log("Voice-only voice input received:", speechText);

    // Stop any existing conversation
    if (conversationState.isActive) {
      console.log("Stopping existing voice-only conversation");
      conversationManager.stopConversation();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Clear any existing messages and start fresh conversation
    conversationManager.stopConversation();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Add the speech input as user message and trigger contextual responses
    console.log("Starting new voice-only conversation with speech input as context");
    await conversationManager.addUserMessage(speechText);
  };

  const handleTextInput = async () => {
    if (!conversationManager || !textInput.trim()) return;

    console.log("Voice-only text input received:", textInput);

    // Stop any existing conversation
    if (conversationState.isActive) {
      console.log("Stopping existing voice-only conversation");
      conversationManager.stopConversation();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Clear any existing messages and start fresh conversation
    conversationManager.stopConversation();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Add the text input as user message and trigger contextual responses
    console.log("Starting new voice-only conversation with text input as context");
    await conversationManager.addUserMessage(textInput);
    setTextInput("");
  };

  const handleStartConversation = async () => {
    if (!conversationManager) return;
    
    console.log("Start Voice-Only Conversation button clicked. Participants:", conversationState.participants.length);
    await conversationManager.startConversation();
  };

  const handleStopConversation = () => {
    if (conversationManager) {
      conversationManager.stopConversation();
    }
  };

  const handlePlayMessage = async (message: any) => {
    if (!conversationManager) return;
    
    await conversationManager.playMessageAudio(message);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading voice interface...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center space-x-3">
            <Volume2 className="w-10 h-10 text-purple-600" />
            <span>Voice Only</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Voice-first conversations with your virtual friends
          </p>
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No virtual friends available for voice conversations.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Please create some virtual friends first to use Voice Only mode.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Live Conversation Display */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                  <span>Live Voice Conversation</span>
                  <span className="text-sm text-gray-500">({friends.length} friends)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConversationDisplay
                  conversationState={conversationState}
                  onPlayMessage={handlePlayMessage}
                  onStartConversation={handleStartConversation}
                  onStopConversation={handleStopConversation}
                  isLoading={false}
                />
              </CardContent>
            </Card>

            {/* Voice Input - Primary Input Method */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-2 border-purple-200 dark:border-purple-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="w-6 h-6 text-purple-600" />
                  <span>Voice Input</span>
                  <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                    Primary
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Speak to start a conversation with your virtual friends
                </p>
                <SpeechInput 
                  onTextSubmit={handleSpeechInput}
                  isProcessing={conversationState.isActive}
                />
              </CardContent>
            </Card>

            {/* Text Input - Alternative Method */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-6 h-6 text-gray-500" />
                  <span>Text Input</span>
                  <span className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                    Alternative
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="text-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type your message to start a conversation
                  </Label>
                  <Textarea
                    id="text-input"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your message here..."
                    className="mt-2 h-20 resize-none"
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      {textInput.length}/500 chars
                    </span>
                    <Button
                      onClick={handleTextInput}
                      disabled={!textInput.trim() || conversationState.isActive}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Start Conversation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Virtual Friends</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{friends.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{conversationState.messages.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}