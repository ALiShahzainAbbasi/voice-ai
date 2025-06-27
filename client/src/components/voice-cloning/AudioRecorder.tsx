import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AudioUtils } from "@/utils/audio";

interface AudioRecorderProps {
  onAudioRecorded: (audioUrl: string) => void;
  recordedAudio: string | null;
  isProcessing?: boolean;
}

export function AudioRecorder({ onAudioRecorded, recordedAudio, isProcessing }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Update audio element when recordedAudio changes
  useEffect(() => {
    if (audioRef.current && recordedAudio) {
      audioRef.current.src = recordedAudio;
      audioRef.current.load();
      console.log('Audio element src updated:', recordedAudio);
    }
  }, [recordedAudio]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const options = AudioUtils.getMediaRecorderOptions();
      const mediaRecorder = new MediaRecorder(stream, options);
      console.log('MediaRecorder created with mimeType:', mediaRecorder.mimeType);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        if (audioBlob.size === 0) {
          console.error('No audio data recorded');
          toast({
            title: "Recording Failed",
            description: "No audio data was captured. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Clear any existing recorded audio
        if (recordedAudio) {
          URL.revokeObjectURL(recordedAudio);
        }
        
        console.log('Audio recorded successfully:', audioUrl, 'Blob size:', audioBlob.size, 'Type:', audioBlob.type);
        onAudioRecorded(audioUrl);
        
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
        title: "Recording Stopped",
        description: "Processing your audio recording...",
      });
    }
  };

  const clearAudio = () => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
      onAudioRecorded('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-3">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          variant={isRecording ? "destructive" : "default"}
          className="flex-1"
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

      {recordedAudio && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Audio Preview</Label>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <audio 
              ref={audioRef}
              controls 
              className="flex-1"
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
              onClick={() => {
                if (audioRef.current) {
                  console.log('Manual play attempt, audio src:', audioRef.current.src);
                  audioRef.current.play().then(() => {
                    console.log('Audio played successfully');
                  }).catch(e => {
                    console.error('Manual play failed:', e);
                  });
                }
              }}
              variant="outline"
              size="sm"
            >
              <Play className="w-4 h-4" />
            </Button>
            <Button
              onClick={clearAudio}
              variant="outline"
              size="sm"
              disabled={isProcessing}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}