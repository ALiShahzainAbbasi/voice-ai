import { VolumeX, Volume2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface VoiceControlPanelProps {
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
}

export function VoiceControlPanel({ 
  playbackSpeed, 
  onPlaybackSpeedChange, 
  masterVolume, 
  onMasterVolumeChange 
}: VoiceControlPanelProps) {
  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Global Controls</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Playback Speed</Label>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">0.5x</span>
              <Slider
                value={[playbackSpeed]}
                onValueChange={([value]) => onPlaybackSpeedChange(value)}
                min={0.5}
                max={2}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">2x</span>
            </div>
            <div className="text-center mt-1">
              <span className="text-sm font-medium text-voice-blue">{playbackSpeed.toFixed(1)}x</span>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Master Volume</Label>
            <div className="flex items-center space-x-3">
              <VolumeX className="text-gray-400 w-4 h-4" />
              <Slider
                value={[masterVolume]}
                onValueChange={([value]) => onMasterVolumeChange(value)}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <Volume2 className="text-gray-400 w-4 h-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
