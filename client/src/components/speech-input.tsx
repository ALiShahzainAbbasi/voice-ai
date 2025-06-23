import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechInputProps {
  onTextSubmit: (text: string) => void;
  isProcessing?: boolean;
}

export function SpeechInput({ onTextSubmit, isProcessing = false }: SpeechInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        // Only update with final transcript to avoid duplication
        if (finalTranscript.trim()) {
          setTranscript(finalTranscript.trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Don't show error toast for "aborted" errors (happens when user stops manually)
        if (event.error === 'aborted') {
          return;
        }
        
        let errorMessage = 'Speech recognition failed';
        if (event.error === 'not-allowed') {
          errorMessage = 'Microphone access denied. Please allow microphone permissions.';
        } else if (event.error === 'no-speech') {
          errorMessage = 'No speech detected. Please try again.';
        }
        
        toast({
          title: "Speech Recognition Error",
          description: errorMessage,
          variant: "destructive",
        });
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast({
          title: "Error",
          description: "Failed to start speech recognition",
          variant: "destructive",
        });
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      
      // Auto-submit when user manually stops speaking
      setTimeout(() => {
        handleSubmit();
      }, 500); // Small delay to ensure transcript is captured
    }
  };

  const handleSubmit = () => {
    const text = transcript.trim();
    if (text) {
      onTextSubmit(text);
      setTranscript("");
    } else {
      // If no transcript but user wants to start conversation, use a default message
      onTextSubmit("Let's start chatting!");
      setTranscript("");
    }
  };

  const clearTranscript = () => {
    setTranscript("");
  };

  if (!isSupported) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-amber-700">
            <MicOff className="w-5 h-5" />
            <span className="text-sm">
              Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Voice Input</h3>
          {isListening && (
            <Badge variant="secondary" className="bg-red-100 text-red-700 animate-pulse">
              <Volume2 className="w-3 h-3 mr-1" />
              Listening...
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Click 'Start Speaking' and speak your message, or type here..."
            className="h-24 resize-none"
            maxLength={500}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                variant={isListening ? "destructive" : "default"}
                size="sm"
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop & Start Chat
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Speaking
                  </>
                )}
              </Button>

              {transcript && (
                <Button
                  onClick={clearTranscript}
                  variant="outline"
                  size="sm"
                  disabled={isProcessing || isListening}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {transcript.length}/500 chars
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!transcript.trim() || isProcessing || isListening}
                className="bg-voice-blue text-white hover:bg-voice-blue hover:opacity-90"
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Start Autonomous Chat
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}