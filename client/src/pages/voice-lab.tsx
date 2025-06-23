import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Friend } from "@shared/schema";
import { ConversationDisplay } from "@/components/conversation-display";
import { ConversationIntegration } from "@/components/conversation-integration";
import { TextInputSection } from "@/components/text-input-section";
import { VoiceControlPanel } from "@/components/voice-control-panel";
import { SpeechInput } from "@/components/speech-input";
import { OpenAIConversationManager, type ConversationState } from "@/lib/openai-conversation-manager";
import { generateVoiceForAllFriends } from "@/lib/voice-service";
import { LocalStorageService } from "@/lib/local-storage";

export default function VoiceLab() {
  const [textInput, setTextInput] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [conversationManager, setConversationManager] = useState<OpenAIConversationManager | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>({
    messages: [],
    isActive: false,
    participants: [],
    lastSpeaker: undefined
  });

  const { data: friends = [], isLoading } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
  });

  // Initialize conversation manager when friends data changes
  useEffect(() => {
    console.log("VoiceLab useEffect - Friends data:", friends.length, "friends");
    
    if (friends.length > 0) {
      // Always create a new manager to ensure clean state
      if (conversationManager) {
        conversationManager.stopConversation();
      }
      
      console.log("Creating fresh OpenAI conversation manager with friends:", friends.map(f => f.name));
      const manager = new OpenAIConversationManager(friends, (newState) => {
        console.log("Conversation state updated - participants:", newState.participants.length);
        setConversationState(newState);
      });
      setConversationManager(manager);
    } else {
      console.log("No friends available - clearing conversation manager");
      if (conversationManager) {
        conversationManager.stopConversation();
      }
      setConversationManager(null);
      setConversationState({
        messages: [],
        isActive: false,
        participants: [],
        lastSpeaker: undefined
      });
    }
  }, [friends.length, friends]);

  // Load settings from localStorage
  useEffect(() => {
    const settings = LocalStorageService.loadSettings();
    setTextInput(settings.lastTextInput);
    setPlaybackSpeed(settings.playbackSpeed);
    setMasterVolume(settings.masterVolume);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    LocalStorageService.saveSettings({
      lastTextInput: textInput,
      playbackSpeed,
      masterVolume
    });
  }, [textInput, playbackSpeed, masterVolume]);

  const handleTestAll = async () => {
    if (!textInput.trim() || friends.length === 0) return;
    
    setIsTestingAll(true);
    try {
      await generateVoiceForAllFriends(friends, textInput, playbackSpeed, masterVolume);
    } catch (error) {
      console.error("Failed to test all voices:", error);
    } finally {
      setIsTestingAll(false);
    }
  };

  const handleTextGenerated = (text: string) => {
    setTextInput(text);
  };

  const handleTemplateSelected = (templateScenario: string) => {
    if (conversationManager) {
      conversationManager.setConversationContext(templateScenario);
      console.log("Template scenario set for autonomous chat:", templateScenario);
    }
  };

  const handleStartConversation = async () => {
    if (!conversationManager) return;
    
    console.log("Start Autonomous Conversation button clicked. Participants:", friends.length);
    await conversationManager.startConversation();
  };

  const handleStopConversation = () => {
    if (!conversationManager) return;
    
    conversationManager.stopConversation();
  };

  const handlePlayMessage = async (message: any) => {
    if (!conversationManager) return;
    
    await conversationManager.playMessageAudio(message);
  };

  const handleSpeechInput = async (speechText: string) => {
    if (!conversationManager || !speechText.trim()) return;

    console.log("Voice input received:", speechText);

    // Stop any existing conversation completely
    if (conversationState.isActive) {
      console.log("Stopping existing conversation");
      conversationManager.stopConversation();
      // Wait longer to ensure complete stop
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Clear any existing messages and start fresh
    conversationManager.stopConversation();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Add the speech input as user message and trigger contextual responses
    console.log("Starting new conversation with speech input as context");
    await conversationManager.addUserMessage(speechText);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading voice lab...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Voice Manager
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Test voices, generate conversations, and explore AI dialogue
          </p>
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No virtual friends available for voice testing.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Please create some virtual friends first to use the Voice Manager.
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Live Conversation - Moved to top */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Live Conversation
              </h2>
              <ConversationDisplay
                conversationState={conversationState}
                onPlayMessage={handlePlayMessage}
                onStartConversation={handleStartConversation}
                onStopConversation={handleStopConversation}
                isLoading={false}
              />
            </div>

            {/* Speech Input */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Voice Input
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Speak to automatically start a conversation with your virtual friends
              </p>
              <SpeechInput 
                onTextSubmit={handleSpeechInput}
                isProcessing={conversationState.isActive}
              />
            </div>

            {/* Text Input Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Text Voice Testing
              </h2>
              <TextInputSection
                textInput={textInput}
                onTextChange={setTextInput}
                onTestAll={handleTestAll}
                isTestingAll={isTestingAll}
              />
            </div>

            {/* Conversation Templates */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Conversation Templates
              </h2>
              <ConversationIntegration 
                onTextGenerated={handleTextGenerated}
                onTemplateSelected={handleTemplateSelected}
              />
            </div>

            {/* Voice Control Panel - Moved to bottom */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Voice Controls
              </h2>
              <VoiceControlPanel
                playbackSpeed={playbackSpeed}
                onPlaybackSpeedChange={setPlaybackSpeed}
                masterVolume={masterVolume}
                onMasterVolumeChange={setMasterVolume}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}