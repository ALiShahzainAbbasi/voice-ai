import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { analyzeSentiment, getVoiceRecommendations } from "@/lib/sentiment-analyzer";

interface SentimentIndicatorProps {
  text: string;
  personality: string;
  currentStability: number;
  currentSimilarity: number;
}

export function SentimentIndicator({ 
  text, 
  personality, 
  currentStability, 
  currentSimilarity 
}: SentimentIndicatorProps) {
  if (!text.trim()) {
    return null;
  }

  const sentiment = analyzeSentiment(text);
  const recommendations = getVoiceRecommendations(sentiment, personality);
  
  const getSentimentIcon = () => {
    switch (sentiment.sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentColor = () => {
    switch (sentiment.sentiment) {
      case 'positive':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const adjustedStability = Math.max(0, Math.min(1, currentStability + recommendations.stabilityAdjustment));
  const adjustedSimilarity = Math.max(0, Math.min(1, currentSimilarity + recommendations.similarityAdjustment));

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Voice Mood Analysis</h4>
              <Badge className={`${getSentimentColor()} text-xs`}>
                {getSentimentIcon()}
                <span className="ml-1 capitalize">{sentiment.sentiment}</span>
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-gray-600">Intensity:</div>
                <div className="font-medium">{(sentiment.intensity * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-gray-600">Confidence:</div>
                <div className="font-medium">{(sentiment.confidence * 100).toFixed(0)}%</div>
              </div>
            </div>

            {Math.abs(recommendations.stabilityAdjustment) > 0.01 || Math.abs(recommendations.similarityAdjustment) > 0.01 ? (
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="text-xs font-medium text-gray-700 mb-2">Recommended Adjustments:</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-gray-600">Stability:</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">{currentStability.toFixed(2)}</span>
                      <span className="text-blue-600">→</span>
                      <span className="font-medium text-blue-600">{adjustedStability.toFixed(2)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Similarity:</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">{currentSimilarity.toFixed(2)}</span>
                      <span className="text-blue-600">→</span>
                      <span className="font-medium text-blue-600">{adjustedSimilarity.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 italic">
                  {recommendations.reasoning}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-600 italic">
                Current voice settings are optimal for this content.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}