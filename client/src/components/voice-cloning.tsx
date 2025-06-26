import { useState, useRef } from "react";
import { Upload, Mic, MicOff, Play, Pause, Trash2, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface VoiceClone {
  id: string;
  name: string;
  description: string;
  audioUrl: string;
  voiceId?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  createdAt: Date;
}

interface VoiceCloningProps {
  onVoiceCloned: (voiceClone: VoiceClone) => void;
}

export function VoiceCloning({ onVoiceCloned }: VoiceCloningProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [voiceClones, setVoiceClones] = useState<VoiceClone[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        
        console.log('Audio recorded successfully:', audioUrl);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly for 30 seconds to 2 minutes for best results",
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording Completed",
        description: "Audio recorded successfully. You can now preview and process it.",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an audio file (MP3, WAV, M4A, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an audio file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    const audioUrl = URL.createObjectURL(file);
    setUploadedAudio(audioUrl);
    setRecordedAudio(null); // Clear recorded audio if file is uploaded
    
    toast({
      title: "File Uploaded",
      description: "Audio file uploaded successfully. You can now preview and process it.",
    });
  };

  const clearAudio = () => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
      setRecordedAudio(null);
    }
    if (uploadedAudio) {
      URL.revokeObjectURL(uploadedAudio);
      setUploadedAudio(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processVoiceClone = async () => {
    if (!voiceName.trim()) {
      toast({
        title: "Missing Voice Name",
        description: "Please enter a name for your voice clone",
        variant: "destructive",
      });
      return;
    }

    const audioSource = recordedAudio || uploadedAudio;
    if (!audioSource) {
      toast({
        title: "No Audio Source",
        description: "Please record or upload audio first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // Prepare data for the API call
      const requestData = {
        name: voiceName.trim(),
        description: voiceDescription.trim(),
      };

      console.log('Creating voice clone with data:', requestData);

      // Call API to create voice clone
      const cloneResponse = await fetch('/api/create-voice-clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (cloneResponse.ok) {
        const cloneData = await cloneResponse.json();
        
        const newVoiceClone: VoiceClone = {
          id: cloneData.id || `clone-${Date.now()}`,
          name: voiceName,
          description: voiceDescription,
          audioUrl: cloneData.audioUrl || audioSource, // Use generated audio if available
          voiceId: cloneData.voiceId,
          status: 'ready',
          createdAt: new Date(),
        };

        setVoiceClones(prev => [...prev, newVoiceClone]);
        onVoiceCloned(newVoiceClone);
        
        // Clear form
        setVoiceName("");
        setVoiceDescription("");
        clearAudio();
        
        toast({
          title: "Voice Clone Created",
          description: `Successfully created voice clone "${voiceName}"`,
        });
      } else {
        const errorData = await cloneResponse.json();
        throw new Error(errorData.error || 'Failed to create voice clone');
      }
    } catch (error) {
      console.error('Voice cloning error:', error);
      toast({
        title: "Voice Cloning Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const deleteVoiceClone = (cloneId: string) => {
    setVoiceClones(prev => prev.filter(clone => clone.id !== cloneId));
    
    toast({
      title: "Voice Clone Deleted",
      description: "Voice clone has been removed",
    });
  };

  const currentAudio = recordedAudio || uploadedAudio;

  return (
    <div className="space-y-6">
      {/* Voice Recording/Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="w-5 h-5 text-purple-600" />
            <span>Create Voice Clone</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              For best results, provide 30 seconds to 2 minutes of clear speech in a quiet environment. 
              The audio should contain varied expressions and natural speaking patterns.
            </AlertDescription>
          </Alert>

          {/* Recording Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Record Audio</Label>
              <div className="flex space-x-2">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "default"}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Upload Audio File</Label>
              <div className="flex space-x-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                  disabled={isRecording || isProcessing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Audio Preview */}
          {currentAudio && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Audio Preview</Label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <audio 
                  controls 
                  className="flex-1"
                  src={currentAudio}
                  preload="metadata"
                  onError={(e) => {
                    console.error('Audio preview error:', e);
                    toast({
                      title: "Audio Preview Error",
                      description: "Unable to play audio preview. Try recording again.",
                      variant: "destructive",
                    });
                  }}
                  onLoadedData={() => {
                    console.log('Audio preview loaded successfully');
                  }}
                  onCanPlay={() => {
                    console.log('Audio ready to play');
                  }}
                >
                  Your browser does not support audio playback.
                </audio>
                <Button
                  onClick={clearAudio}
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                If preview doesn't work, try recording again or upload a different audio file.
              </p>
            </div>
          )}

          {/* Voice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="voice-name">Voice Name *</Label>
              <Input
                id="voice-name"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="e.g., My Custom Voice"
                disabled={isProcessing}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voice-description">Description</Label>
              <Textarea
                id="voice-description"
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
                placeholder="Optional description of the voice characteristics..."
                disabled={isProcessing}
                maxLength={200}
                rows={3}
              />
            </div>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Label className="text-sm">Creating Voice Clone...</Label>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-gray-500">
                Processing audio and training voice model. This may take a few moments.
              </p>
            </div>
          )}

          {/* Create Button */}
          <Button
            onClick={processVoiceClone}
            disabled={!currentAudio || !voiceName.trim() || isProcessing}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isProcessing ? "Creating Voice Clone..." : "Create Voice Clone"}
          </Button>
        </CardContent>
      </Card>

      {/* Voice Clones List */}
      {voiceClones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Voice Clones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {voiceClones.map((clone) => (
                <div
                  key={clone.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-900"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {clone.name}
                    </h4>
                    {clone.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {clone.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Created {clone.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <audio controls className="w-32">
                      <source src={clone.audioUrl} type="audio/wav" />
                    </audio>
                    <Button
                      onClick={() => deleteVoiceClone(clone.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}