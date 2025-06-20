import { Info, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TextInputSectionProps {
  textInput: string;
  onTextChange: (text: string) => void;
  onTestAll: () => void;
  isTestingAll: boolean;
}

export function TextInputSection({ textInput, onTextChange, onTestAll, isTestingAll }: TextInputSectionProps) {
  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Voice Test Input</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{textInput.length}</span>
            <span>/500 chars</span>
          </div>
        </div>
        
        <Textarea
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Enter text to test with your virtual friends..."
          className="h-32 resize-none"
          maxLength={500}
        />
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="text-gray-400 w-4 h-4" />
            <span className="text-sm text-gray-500">Powered by ElevenLabs</span>
          </div>
          <Button
            onClick={onTestAll}
            disabled={isTestingAll || !textInput.trim()}
            className="bg-voice-blue text-white hover:bg-voice-blue hover:opacity-90 transition-colors duration-200"
          >
            <Play className="w-4 h-4 mr-2" />
            Test All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
