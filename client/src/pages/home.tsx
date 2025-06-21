import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, Users, Download, Upload, Save, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FriendCard } from "@/components/friend-card";
import { FriendEditModal } from "@/components/friend-edit-modal";
import { TextInputSection } from "@/components/text-input-section";
import { SpeechInput } from "@/components/speech-input";
import { ConversationDisplay } from "@/components/conversation-display";
import { VoiceControlPanel } from "@/components/voice-control-panel";
import { SentimentIndicator } from "@/components/sentiment-indicator";
import { ConversationIntegration } from "@/components/conversation-integration";
import { ConversationManager, ConversationState, ConversationMessage } from "@/lib/conversation-manager";
import { useToast } from "@/hooks/use-toast";
import { generateVoiceForAllFriends } from "@/lib/voice-service";
import { LocalStorageService } from "@/lib/local-storage";
import type { Friend } from "@shared/schema";

export default function Home() {
  const [textInput, setTextInput] = useState("Hello, I'm your virtual friend! How are you doing today?");
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [masterVolume, setMasterVolume] = useState(75);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [conversationManager, setConversationManager] = useState<ConversationManager | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>({
    messages: [],
    isActive: false,
    participants: [],
  });
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  
  const { toast } = useToast();

  // Load settings from local storage on mount
  useEffect(() => {
    const settings = LocalStorageService.loadSettings();
    setTextInput(settings.lastTextInput);
    setPlaybackSpeed(settings.playbackSpeed);
    setMasterVolume(settings.masterVolume);
    setAutoSave(settings.autoSaveFriends);
  }, []);

  // Save settings to local storage when they change
  useEffect(() => {
    LocalStorageService.saveSettings({
      lastTextInput: textInput,
      playbackSpeed,
      masterVolume,
      autoSaveFriends: autoSave,
    });
  }, [textInput, playbackSpeed, masterVolume, autoSave]);

  const { data: friends = [], refetch: refetchFriends } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });

  // Initialize conversation manager when friends data changes
  useEffect(() => {
    if (friends.length > 0) {
      const manager = new ConversationManager(friends, setConversationState);
      setConversationManager(manager);
    } else {
      setConversationManager(null);
      setConversationState({
        messages: [],
        isActive: false,
        participants: [],
      });
    }
  }, [friends]);

  // Auto-save friends to local storage when they change
  useEffect(() => {
    if (autoSave && friends.length > 0) {
      LocalStorageService.saveFriends(friends);
    }
  }, [friends, autoSave]);

  const handleEditFriend = (friend: Friend) => {
    setEditingFriend(friend);
    setIsEditModalOpen(true);
  };

  const handleAddFriend = () => {
    setEditingFriend(null);
    setIsEditModalOpen(true);
  };

  const handleTestAllVoices = async () => {
    if (!textInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to test",
        variant: "destructive",
      });
      return;
    }

    if (friends.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one friend to test",
        variant: "destructive",
      });
      return;
    }

    setIsTestingAll(true);
    try {
      await generateVoiceForAllFriends(friends, textInput, playbackSpeed, masterVolume / 100);
      toast({
        title: "Success",
        description: "Voice generation completed for all friends",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate voices for all friends",
        variant: "destructive",
      });
    } finally {
      setIsTestingAll(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const backup = LocalStorageService.createBackup();
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-lab-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Created",
        description: "Your friend configurations have been exported",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive",
      });
    }
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const backup = e.target?.result as string;
            if (LocalStorageService.restoreBackup(backup)) {
              refetchFriends();
              toast({
                title: "Backup Restored",
                description: "Your friend configurations have been imported",
              });
            } else {
              throw new Error("Invalid backup format");
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to import backup",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Conversation handlers
  const handleStartConversation = async () => {
    if (!conversationManager) return;
    
    setIsConversationLoading(true);
    try {
      await conversationManager.startConversation();
      toast({
        title: "Conversation Started",
        description: "Your virtual friends are ready to chat!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    } finally {
      setIsConversationLoading(false);
    }
  };

  const handleStopConversation = () => {
    if (!conversationManager) return;
    
    conversationManager.stopConversation();
    toast({
      title: "Conversation Ended",
      description: "Chat session has been stopped",
    });
  };

  const handleSpeechInput = async (text: string) => {
    if (!conversationManager || !conversationState.isActive) {
      toast({
        title: "Start Conversation First",
        description: "Please start a conversation before speaking",
        variant: "destructive",
      });
      return;
    }

    setIsConversationLoading(true);
    try {
      await conversationManager.addUserMessage(text);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your message",
        variant: "destructive",
      });
    } finally {
      setIsConversationLoading(false);
    }
  };

  const handlePlayMessage = async (message: ConversationMessage) => {
    if (!conversationManager) return;
    
    try {
      await conversationManager.playMessageAudio(message);
    } catch (error) {
      toast({
        title: "Audio Error",
        description: "Failed to play message audio",
        variant: "destructive",
      });
    }
  };

  const emptySlots = Math.max(0, 4 - friends.length);

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-voice-blue rounded-lg flex items-center justify-center">
                <Mic className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Voice Test Lab</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportBackup}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportBackup}
                  className="text-xs"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Import
                </Button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{friends.length}/4 Friends</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Voice Text Input Section */}
          <div>
            <TextInputSection
              textInput={textInput}
              onTextChange={setTextInput}
              onTestAll={handleTestAllVoices}
              isTestingAll={isTestingAll}
            />
          </div>

          {/* Virtual Friends Section - Right after Voice Text Input */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Virtual Friends</h2>
              <Button 
                onClick={handleAddFriend}
                disabled={friends.length >= 4}
                className="bg-voice-emerald text-white hover:bg-voice-emerald hover:opacity-90"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {friends.map((friend: Friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  textInput={textInput}
                  playbackSpeed={playbackSpeed}
                  masterVolume={masterVolume / 100}
                  onEdit={() => handleEditFriend(friend)}
                  onDelete={() => refetchFriends()}
                />
              ))}

              {/* Empty Slots */}
              {Array.from({ length: emptySlots }).map((_, index) => (
                <Card
                  key={`empty-${index}`}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200 cursor-pointer"
                  onClick={handleAddFriend}
                >
                  <CardContent className="p-8 flex flex-col items-center justify-center text-gray-500 h-full min-h-[200px]">
                    <div className="text-3xl mb-3">+</div>
                    <p className="font-medium">Add Friend</p>
                    <p className="text-sm">Customize voice & personality</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Voice Conversation Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Voice Input</h2>
              <SpeechInput
                onTextSubmit={handleSpeechInput}
                isProcessing={isConversationLoading}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Live Conversation</h2>
              <ConversationDisplay
                conversationState={conversationState}
                onPlayMessage={handlePlayMessage}
                onStartConversation={handleStartConversation}
                onStopConversation={handleStopConversation}
                isLoading={isConversationLoading}
              />
            </div>
          </div>

          {/* Controls and Analysis Section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-1 space-y-6">
              <ConversationIntegration
                onTextGenerated={setTextInput}
              />
              
              <VoiceControlPanel
                playbackSpeed={playbackSpeed}
                onPlaybackSpeedChange={setPlaybackSpeed}
                masterVolume={masterVolume}
                onMasterVolumeChange={setMasterVolume}
              />
              
              {/* Sentiment Analysis - At the bottom */}
              {textInput.trim() && friends.length > 0 && (
                <SentimentIndicator
                  text={textInput}
                  personality={friends[0]?.personality || 'cheerful'}
                  currentStability={friends[0]?.stability || 0.75}
                  currentSimilarity={friends[0]?.similarity || 0.85}
                />
              )}
            </div>
            <div className="xl:col-span-2"></div>
          </div>
        </div>
      </div>

      <FriendEditModal
        friend={editingFriend}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={() => {
          refetchFriends();
          setIsEditModalOpen(false);
        }}
      />
    </div>
  );
}
