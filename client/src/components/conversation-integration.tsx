import { useState } from "react";
import { MessageCircle, Plus, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ConversationTemplate {
  id: string;
  name: string;
  scenario: string;
  suggestedText: string;
}

const conversationTemplates: ConversationTemplate[] = [
  {
    id: "friendly-chat",
    name: "Friendly Chat",
    scenario: "Casual conversation with a friend",
    suggestedText: "Hey there! How's your day going? I was just thinking about that amazing coffee shop we went to last week."
  },
  {
    id: "emotional-support",
    name: "Emotional Support",
    scenario: "Providing comfort and encouragement",
    suggestedText: "I'm really sorry you're going through this difficult time. Remember that you're stronger than you think, and this too shall pass."
  },
  {
    id: "professional-meeting",
    name: "Professional Meeting",
    scenario: "Business or work-related discussion",
    suggestedText: "Good morning everyone. I'd like to discuss the quarterly results and our strategic plans for the upcoming quarter."
  },
  {
    id: "storytelling",
    name: "Storytelling",
    scenario: "Narrating a story or experience",
    suggestedText: "Once upon a time, in a small village nestled between rolling hills, there lived a young inventor who dreamed of changing the world."
  },
  {
    id: "debate-discussion",
    name: "Debate/Discussion",
    scenario: "Expressing strong opinions or arguments",
    suggestedText: "I strongly believe that renewable energy is the key to our future. The evidence clearly shows that solar and wind power are becoming more cost-effective."
  }
];

interface ConversationIntegrationProps {
  onTextGenerated: (text: string) => void;
}

export function ConversationIntegration({ onTextGenerated }: ConversationIntegrationProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ConversationTemplate | null>(null);
  const [customScenario, setCustomScenario] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleTemplateSelect = (template: ConversationTemplate) => {
    setSelectedTemplate(template);
    setGeneratedText(template.suggestedText);
  };

  const generateCustomText = () => {
    if (!customScenario.trim()) {
      toast({
        title: "Error",
        description: "Please enter a scenario description",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simple text generation based on scenario keywords
    setTimeout(() => {
      let generatedContent = "";
      const scenario = customScenario.toLowerCase();
      
      if (scenario.includes("happy") || scenario.includes("joy") || scenario.includes("celebration")) {
        generatedContent = "I'm absolutely thrilled about this wonderful news! This calls for a celebration - let's make this moment unforgettable!";
      } else if (scenario.includes("sad") || scenario.includes("grief") || scenario.includes("loss")) {
        generatedContent = "I'm deeply sorry for your loss. During these difficult times, please know that you're not alone and that better days will come.";
      } else if (scenario.includes("angry") || scenario.includes("frustrated") || scenario.includes("upset")) {
        generatedContent = "I understand your frustration, and frankly, I'm quite upset about this situation too. Something needs to change immediately.";
      } else if (scenario.includes("business") || scenario.includes("professional") || scenario.includes("work")) {
        generatedContent = "Let's schedule a meeting to discuss this matter professionally. I believe we can find a solution that benefits everyone involved.";
      } else if (scenario.includes("romantic") || scenario.includes("love") || scenario.includes("date")) {
        generatedContent = "You mean the world to me, and every moment we spend together feels like a beautiful dream come true.";
      } else {
        generatedContent = `In this ${customScenario} scenario, I want to express my thoughts clearly and authentically. Let me share what's on my mind.`;
      }
      
      setGeneratedText(generatedContent);
      setIsGenerating(false);
    }, 1000);
  };

  const useGeneratedText = () => {
    if (generatedText.trim()) {
      onTextGenerated(generatedText);
      toast({
        title: "Text Applied",
        description: "Generated text has been applied to the voice test input",
      });
    }
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <span>Conversation Starter</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selection */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Choose a Conversation Template
          </Label>
          <div className="grid grid-cols-1 gap-2">
            {conversationTemplates.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleTemplateSelect(template)}
                className="justify-start text-left h-auto p-3"
              >
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.scenario}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Scenario */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Or Create Custom Scenario
          </Label>
          <div className="flex space-x-2">
            <Input
              placeholder="Describe your conversation scenario..."
              value={customScenario}
              onChange={(e) => setCustomScenario(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={generateCustomText}
              disabled={isGenerating}
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Generated Text Preview */}
        {generatedText && (
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Generated Text
            </Label>
            <Textarea
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              className="h-24 resize-none"
              placeholder="Generated conversation text will appear here..."
            />
            <Button
              onClick={useGeneratedText}
              className="mt-2 w-full bg-blue-600 text-white hover:bg-blue-700"
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              Use This Text for Voice Testing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}