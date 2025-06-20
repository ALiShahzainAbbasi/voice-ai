import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Play, Volume2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { personalitySettings } from "@/lib/personality-settings";
import { getVoiceMetadata } from "@/lib/voice-metadata";
import type { Friend, InsertFriend } from "@shared/schema";

interface FriendEditModalProps {
  friend: Friend | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function FriendEditModal({ friend, isOpen, onClose, onSave }: FriendEditModalProps) {
  const [formData, setFormData] = useState<Partial<InsertFriend>>({
    name: "",
    personality: "cheerful",
    voice: "",
    voiceId: "",
    gender: "female",
    age: 28,
    race: "white",
    religion: "christian",
    politicalLeaning: -15,
    stability: 0.75,
    similarity: 0.85,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  const { data: voices = [] } = useQuery<Array<{voice_id: string, name: string, labels?: {gender?: string, accent?: string}}>>({
    queryKey: ["/api/voices"],
    enabled: isOpen,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<InsertFriend>) => {
      if (friend) {
        return await apiRequest("PATCH", `/api/friends/${friend.id}`, data);
      } else {
        return await apiRequest("POST", "/api/friends", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Success",
        description: friend ? "Friend updated successfully" : "Friend created successfully",
      });
      onSave();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save friend",
        variant: "destructive",
      });
    },
  });

  const playVoiceSample = async (voiceId: string) => {
    if (!voiceId || isPlayingSample) return;

    try {
      setIsPlayingSample(true);
      console.log("Playing voice sample for:", voiceId);
      
      const response = await apiRequest("POST", "/api/voice-sample", { voiceId, sampleType: "greeting" }) as any;
      console.log("Voice sample response:", response);
      
      if (response.audio) {
        // Create audio blob from base64
        const binaryString = atob(response.audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onloadeddata = () => {
          console.log("Audio loaded successfully");
        };
        
        audio.onended = () => {
          console.log("Audio playback ended");
          setIsPlayingSample(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          setIsPlayingSample(false);
          URL.revokeObjectURL(audioUrl);
          toast({
            title: "Error",
            description: "Failed to play voice sample",
            variant: "destructive",
          });
        };
        
        // Set volume and play
        audio.volume = 0.8;
        
        try {
          await audio.play();
          console.log("Audio started playing");
        } catch (playError) {
          console.error("Play error:", playError);
          setIsPlayingSample(false);
          URL.revokeObjectURL(audioUrl);
          toast({
            title: "Error",
            description: "Browser blocked audio playback. Please interact with the page first.",
            variant: "destructive",
          });
        }
      } else {
        setIsPlayingSample(false);
        toast({
          title: "Error",
          description: "No audio data received",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Voice sample generation error:", error);
      setIsPlayingSample(false);
      toast({
        title: "Error",
        description: "Failed to generate voice sample",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (friend) {
      setFormData({
        name: friend.name,
        personality: friend.personality,
        voice: friend.voice,
        voiceId: friend.voiceId || "",
        gender: friend.gender,
        age: friend.age,
        race: friend.race,
        religion: friend.religion,
        politicalLeaning: friend.politicalLeaning,
        stability: friend.stability,
        similarity: friend.similarity,
      });
    } else {
      setFormData({
        name: "",
        personality: "cheerful",
        voice: "",
        voiceId: "",
        gender: "female",
        age: 28,
        race: "white",
        religion: "christian",
        politicalLeaning: -15,
        stability: 0.75,
        similarity: 0.85,
      });
    }
  }, [friend, isOpen]);

  const handlePersonalityChange = (personality: string) => {
    const settings = personalitySettings[personality];
    setFormData(prev => ({
      ...prev,
      personality,
      stability: settings.stability,
      similarity: settings.similarity,
    }));
  };

  const handleVoiceChange = (voiceId: string) => {
    const selectedVoice = voices.find((v: any) => v.voice_id === voiceId);
    setFormData(prev => ({
      ...prev,
      voice: selectedVoice ? selectedVoice.name : "",
      voiceId,
    }));
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.voiceId) {
      toast({
        title: "Error",
        description: "Please select a voice",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(formData as InsertFriend);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{friend ? "Edit Friend" : "Add Friend"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter friend's name"
              />
            </div>
            <div>
              <Label htmlFor="personality">Personality</Label>
              <Select value={formData.personality} onValueChange={handlePersonalityChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(personalitySettings).map(([key, setting]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span className="font-medium capitalize">{key}</span>
                        <span className="text-xs text-gray-500">{setting.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Voice Selection */}
          <div>
            <Label htmlFor="voice">Voice Selection</Label>
            <div className="space-y-3 mt-2">
              {voices.map((voice: any) => {
                const metadata = getVoiceMetadata(voice.voice_id);
                const isSelected = formData.voiceId === voice.voice_id;
                
                return (
                  <div
                    key={voice.voice_id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleVoiceChange(voice.voice_id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{voice.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {metadata?.gender || voice.labels?.gender || "Unknown"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {metadata?.accent || voice.labels?.accent || "Unknown"}
                          </Badge>
                          {metadata && (
                            <Badge variant="outline" className="text-xs">
                              {metadata.category}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            {metadata?.description || `${voice.name} voice with natural speech characteristics`}
                          </p>
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Best for:</span> {metadata?.use_case || "General conversation and content"}
                          </p>
                          {metadata && (
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Age:</span> {metadata.age}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          playVoiceSample(voice.voice_id);
                        }}
                        disabled={isPlayingSample}
                        className="ml-3"
                      >
                        {isPlayingSample ? (
                          <Volume2 className="w-4 h-4 animate-pulse" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="age">Age: {formData.age}</Label>
              <Slider
                value={[formData.age || 28]}
                onValueChange={([value]) => setFormData(prev => ({ ...prev, age: value }))}
                min={18}
                max={80}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="race">Race</Label>
              <Select value={formData.race} onValueChange={(value) => setFormData(prev => ({ ...prev, race: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="black">Black</SelectItem>
                  <SelectItem value="hispanic">Hispanic</SelectItem>
                  <SelectItem value="asian">Asian</SelectItem>
                  <SelectItem value="native">Native American</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Religion & Politics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="religion">Religion</Label>
              <Select value={formData.religion} onValueChange={(value) => setFormData(prev => ({ ...prev, religion: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="christian">Christian</SelectItem>
                  <SelectItem value="islam">Islam</SelectItem>
                  <SelectItem value="jewish">Jewish</SelectItem>
                  <SelectItem value="hindu">Hindu</SelectItem>
                  <SelectItem value="buddhist">Buddhist</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="political">Political Leaning: {formData.politicalLeaning}</Label>
              <div className="flex items-center space-x-3 mt-2">
                <span className="text-xs text-gray-500">Left -100</span>
                <Slider
                  value={[formData.politicalLeaning || -15]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, politicalLeaning: value }))}
                  min={-100}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500">Right +100</span>
              </div>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Voice Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stability">Stability: {formData.stability?.toFixed(2)}</Label>
                <Slider
                  value={[formData.stability || 0.75]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, stability: value }))}
                  min={0}
                  max={1}
                  step={0.05}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Lower = more expressive, Higher = more stable</p>
              </div>
              <div>
                <Label htmlFor="similarity">Similarity: {formData.similarity?.toFixed(2)}</Label>
                <Slider
                  value={[formData.similarity || 0.85]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, similarity: value }))}
                  min={0}
                  max={1}
                  step={0.05}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">How closely to match the original voice</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-voice-blue text-white hover:bg-voice-blue hover:opacity-90"
          >
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
