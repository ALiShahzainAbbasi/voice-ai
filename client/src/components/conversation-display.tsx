import { useState, useRef, useEffect } from "react";
import { MessageCircle, Play, Pause, User, Users, Volume2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationMessage, ConversationState } from "@/lib/conversation-manager";
import { Friend } from "@shared/schema";

interface ConversationDisplayProps {
  conversationState: ConversationState;
  onPlayMessage: (message: ConversationMessage) => void;
  onStartConversation: () => void;
  onStopConversation: () => void;
  isLoading?: boolean;
}

export function ConversationDisplay({ 
  conversationState, 
  onPlayMessage, 
  onStartConversation, 
  onStopConversation,
  isLoading = false 
}: ConversationDisplayProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  console.log('ConversationDisplay render - participants:', conversationState.participants.length, 'isActive:', conversationState.isActive);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [conversationState.messages]);

  const getFriendById = (friendId?: number): Friend | undefined => {
    return conversationState.participants.find(f => f.id === friendId);
  };

  const getMessageStyling = (message: ConversationMessage) => {
    switch (message.speaker) {
      case 'user':
        return "bg-blue-500 text-white ml-auto max-w-[80%]";
      case 'host':
        return "bg-green-100 text-green-800 border border-green-200 mx-auto max-w-[90%]";
      case 'friend':
        const friend = getFriendById(message.friendId);
        const personalityColors = {
          cheerful: "bg-yellow-100 border-yellow-300 text-yellow-800",
          romantic: "bg-pink-100 border-pink-300 text-pink-800",
          unhinged: "bg-red-100 border-red-300 text-red-800",
          sarcastic: "bg-purple-100 border-purple-300 text-purple-800",
          wise: "bg-indigo-100 border-indigo-300 text-indigo-800",
          mysterious: "bg-gray-100 border-gray-400 text-gray-800",
          aggressive: "bg-orange-100 border-orange-300 text-orange-800",
          gentle: "bg-emerald-100 border-emerald-300 text-emerald-800",
          confident: "bg-blue-100 border-blue-300 text-blue-800",
          playful: "bg-cyan-100 border-cyan-300 text-cyan-800",
          melancholic: "bg-slate-100 border-slate-300 text-slate-800",
          authoritative: "bg-stone-100 border-stone-300 text-stone-800"
        };
        const colorClass = friend ? personalityColors[friend.personality as keyof typeof personalityColors] : "bg-gray-100 border-gray-300 text-gray-800";
        return `${colorClass} border mr-auto max-w-[80%]`;
      default:
        return "bg-gray-100 text-gray-800 mx-auto max-w-[90%]";
    }
  };

  const getSpeakerIcon = (message: ConversationMessage) => {
    switch (message.speaker) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'host':
        return <Users className="w-4 h-4" />;
      case 'friend':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getSpeakerName = (message: ConversationMessage) => {
    switch (message.speaker) {
      case 'user':
        return 'You';
      case 'host':
        return 'Host';
      case 'friend':
        const friend = getFriendById(message.friendId);
        return friend ? friend.name : 'Friend';
      default:
        return 'Unknown';
    }
  };

  if (!conversationState.isActive) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-blue-100 p-4">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Autonomous Voice Chat</h3>
              <p className="text-gray-600 mb-4">
                Your virtual friends will chat naturally among themselves with a happy moderator keeping the conversation flowing. Just sit back and listen!
              </p>
              {conversationState.participants.length === 0 ? (
                <p className="text-sm text-amber-600 mb-4">
                  Create some virtual friends first to start a conversation.
                </p>
              ) : (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Ready to chat with:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {conversationState.participants.map(friend => (
                      <Badge key={friend.id} variant="secondary" className="text-xs">
                        {friend.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Button 
                onClick={() => {
                  console.log('Start Autonomous Conversation button clicked. Participants:', conversationState.participants.length);
                  onStartConversation();
                }}
                disabled={conversationState.participants.length === 0 || isLoading}
                className="bg-voice-blue text-white hover:bg-voice-blue hover:opacity-90"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Autonomous Chat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Live Conversation</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700 animate-pulse">
              <Volume2 className="w-3 h-3 mr-1" />
              Auto Chat Active
            </Badge>
            <Button
              onClick={onStopConversation}
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
            >
              End Chat
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96 w-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {conversationState.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 
                  message.speaker === 'host' ? 'justify-center' : 'justify-start'}`}
              >
                <div className={`rounded-lg p-3 ${getMessageStyling(message)}`}>
                  <div className="flex items-start space-x-2">
                    <div className="flex items-center space-x-1 mb-1">
                      {getSpeakerIcon(message)}
                      <span className="text-xs font-medium">
                        {getSpeakerName(message)}
                      </span>
                      <span className="text-xs opacity-60">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    {message.voiceUrl && (
                      <Button
                        onClick={() => onPlayMessage(message)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                        disabled={message.isPlaying}
                      >
                        {message.isPlaying ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-300 text-gray-800 rounded-lg p-3 mr-auto max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">Friend is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {conversationState.lastSpeaker && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Last response from: <span className="font-medium">{conversationState.lastSpeaker}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}