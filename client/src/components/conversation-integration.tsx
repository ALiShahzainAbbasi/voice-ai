import { useState } from "react";
import { MessageCircle, Plus, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import type { ConversationIntegrationProps, ConversationTemplate } from '@/types';
import { CONVERSATION_TEMPLATES } from '@/constants';

export function ConversationIntegration({ onTextGenerated, onTemplateSelected }: ConversationIntegrationProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ConversationTemplate | null>(null);
  const [customScenario, setCustomScenario] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleTemplateSelect = (template: ConversationTemplate) => {
    setSelectedTemplate(template);
    setGeneratedText(template.suggestedText);
    
    // Notify parent component about template selection for autonomous chat
    if (onTemplateSelected) {
      onTemplateSelected(template.scenario);
    }
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
          <p className="text-xs text-gray-600 mb-3">
            Selecting a template automatically starts autonomous chat with that theme
          </p>
          
          {selectedTemplate && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Active scenario:</span> {selectedTemplate.scenario}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Virtual friends will discuss topics related to this scenario
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-2">
            {CONVERSATION_TEMPLATES.map((template: ConversationTemplate) => (
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