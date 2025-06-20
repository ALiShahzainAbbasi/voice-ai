import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Edit, Trash2, Play, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateVoice } from "@/lib/voice-service";
import type { Friend } from "@shared/schema";

interface FriendCardProps {
  friend: Friend;
  textInput: string;
  playbackSpeed: number;
  masterVolume: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function FriendCard({ friend, textInput, playbackSpeed, masterVolume, onEdit, onDelete }: FriendCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/friends/${friend.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend deleted",
        description: `${friend.name} has been removed`,
      });
      onDelete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete friend",
        variant: "destructive",
      });
    },
  });

  const handlePlayVoice = async () => {
    if (!textInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to play",
        variant: "destructive",
      });
      return;
    }

    setIsPlaying(true);
    try {
      await generateVoice(friend, textInput, playbackSpeed, masterVolume);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate voice",
        variant: "destructive",
      });
    } finally {
      setIsPlaying(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${friend.name}?`)) {
      deleteMutation.mutate();
    }
  };

  const getPersonalityColor = (personality: string) => {
    switch (personality.toLowerCase()) {
      case 'cheerful':
        return 'from-blue-50 to-indigo-50';
      case 'romantic':
        return 'from-pink-50 to-rose-50';
      case 'unhinged':
        return 'from-emerald-50 to-green-50';
      case 'sarcastic':
        return 'from-purple-50 to-violet-50';
      case 'wise':
        return 'from-amber-50 to-yellow-50';
      default:
        return 'from-gray-50 to-slate-50';
    }
  };

  const getPersonalityIconColor = (personality: string) => {
    switch (personality.toLowerCase()) {
      case 'cheerful':
        return 'bg-voice-blue';
      case 'romantic':
        return 'bg-pink-500';
      case 'unhinged':
        return 'bg-voice-emerald';
      case 'sarcastic':
        return 'bg-purple-500';
      case 'wise':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const politicalPosition = ((friend.politicalLeaning + 100) / 200) * 100;

  return (
    <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Friend Header */}
      <div className={`p-4 bg-gradient-to-r ${getPersonalityColor(friend.personality)} border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${getPersonalityIconColor(friend.personality)} rounded-full flex items-center justify-center`}>
              <User className="text-white w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{friend.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{friend.personality}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Friend Details */}
      <CardContent className="p-4 space-y-4">
        {/* Demographics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Voice:</span>
            <span className="ml-2 font-medium">{friend.voice}</span>
          </div>
          <div>
            <span className="text-gray-500">Age:</span>
            <span className="ml-2 font-medium">{friend.age}</span>
          </div>
          <div>
            <span className="text-gray-500">Gender:</span>
            <span className="ml-2 font-medium capitalize">{friend.gender}</span>
          </div>
          <div>
            <span className="text-gray-500">Race:</span>
            <span className="ml-2 font-medium capitalize">{friend.race}</span>
          </div>
        </div>

        {/* Political & Religious */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Political:</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Left</span>
              <div className="w-16 h-2 bg-gray-200 rounded-full relative">
                <div 
                  className="absolute top-0 w-2 h-2 bg-voice-blue rounded-full"
                  style={{ left: `${Math.max(0, Math.min(88, politicalPosition - 4))}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">Right</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Religion:</span>
            <span className="font-medium capitalize">{friend.religion}</span>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Stability:</span>
            <span className="font-medium text-voice-blue">{friend.stability.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Similarity:</span>
            <span className="font-medium text-voice-blue">{friend.similarity.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handlePlayVoice}
          disabled={isPlaying}
          className="w-full py-3 bg-voice-blue text-white hover:bg-voice-blue hover:opacity-90 transition-colors duration-200"
        >
          {isPlaying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Play Voice
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
