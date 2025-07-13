"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, CheckCircle, XCircle, AlertCircle, Languages, Globe } from "lucide-react";
import { aiAssistant, AIResponse } from "@/lib/ai-assistant";
import { ollamaManager } from "@/lib/ollama-config";
import { toast } from "sonner";

export default function AITestPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [ollamaStatus, setOllamaStatus] = useState<{
    connected: boolean;
    models: string[];
    loading: boolean;
  }>({
    connected: false,
    models: [],
    loading: true,
  });

  const testQuestions = [
    "Am I eligible for SC scholarship?",
    "How do I prove my income is less than ₹1,00,000?",
    "What documents do I need for scholarship application?",
    "How does privacy protection work in this system?",
    "Can you help me generate a ZKP proof?",
    "What scholarships are available for rural students?",
  ];

  const checkOllamaStatus = async () => {
    setOllamaStatus(prev => ({ ...prev, loading: true }));
    try {
      const connected = await ollamaManager.checkConnection();
      const models = connected ? await ollamaManager.getAvailableModels() : [];
      setOllamaStatus({ connected, models, loading: false });
    } catch (error) {
      console.error("Error checking Ollama status:", error);
      setOllamaStatus({ connected: false, models: [], loading: false });
    }
  };

  const askQuestion = async (customQuestion?: string) => {
    const questionToAsk = customQuestion || question;
    if (!questionToAsk.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const result = await aiAssistant.query(questionToAsk);
      setResponse(result);
      toast.success("AI response received!");
    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  const pullModel = async (modelName: string) => {
    try {
      toast.info(`Pulling model ${modelName}...`);
      const success = await ollamaManager.pullModel(modelName);
      if (success) {
        toast.success(`Model ${modelName} pulled successfully!`);
        checkOllamaStatus(); // Refresh status
      } else {
        toast.error(`Failed to pull model ${modelName}.`);
      }
    } catch (error) {
      console.error("Error pulling model:", error);
      toast.error("Error pulling model");
    }
  };

  // Check Ollama status on component mount
  useState(() => {
    checkOllamaStatus();
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          AI Assistant 
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Test the Llama AI integration for the EduRaksha AI Assistant with multilingual support
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Globe className="w-4 h-4" />
          <span>Supports English, Kannada, and Hindi</span>
        </div>
      </div>

      {/* Ollama Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>Ollama Status</span>
          </CardTitle>
          <CardDescription>
            Check if Ollama is running and models are available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {ollamaStatus.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : ollamaStatus.connected ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="font-medium">
                Ollama Connection: {ollamaStatus.loading ? "Checking..." : ollamaStatus.connected ? "Connected" : "Not Connected"}
              </span>
            </div>

            {ollamaStatus.connected && (
              <div>
                <h4 className="font-medium mb-2">Available Models:</h4>
                {ollamaStatus.models.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {ollamaStatus.models.map((model) => (
                      <Badge key={model} variant="outline" className="text-green-700 border-green-300">
                        {model}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No models found</p>
                )}
              </div>
            )}

            <div className="flex space-x-2">
              <Button onClick={checkOllamaStatus} variant="outline" size="sm">
                Refresh Status
              </Button>
              {ollamaStatus.connected && (
                <Button 
                  onClick={() => pullModel("llama3.2")} 
                  variant="outline" 
                  size="sm"
                >
                  Pull llama3.2
                </Button>
              )}
            </div>

            {!ollamaStatus.connected && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Ollama Not Running</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Please install and start Ollama to use Llama models. 
                      The AI Assistant will fall back to mock responses with translations.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <span>Ask the AI Assistant</span>
          </CardTitle>
          <CardDescription>
            Test the AI assistant with questions about scholarships and privacy. All responses are automatically translated to Kannada and Hindi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Quick Test Questions */}
            <div>
              <Label className="text-sm font-medium">Quick Test Questions:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {testQuestions.map((testQ) => (
                  <Button
                    key={testQ}
                    variant="outline"
                    size="sm"
                    onClick={() => askQuestion(testQ)}
                    disabled={isLoading}
                  >
                    {testQ}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Question Input */}
            <div className="space-y-2">
              <Label htmlFor="question">Ask a custom question:</Label>
              <div className="flex space-x-2">
                <Input
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter your question here..."
                  onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                />
                <Button onClick={() => askQuestion()} disabled={isLoading || !question.trim()}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* AI Response */}
            {response && (
              <div className="space-y-4">
                {/* English Response */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="text-sm font-medium text-blue-900">AI Response (English):</p>
                        <Badge variant="outline" className="text-blue-700 border-blue-300">
                          Original
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{response.answer}</p>
                    </div>
                  </div>
                </div>

                {/* Translation Toggle */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTranslations(!showTranslations)}
                    className="flex items-center space-x-2"
                  >
                    <Languages className="w-4 h-4" />
                    <span>{showTranslations ? 'Hide' : 'Show'} Translations</span>
                  </Button>
                  {response.translations && (
                    <Badge variant="secondary" className="text-green-700">
                      {Object.keys(response.translations).length} languages available
                    </Badge>
                  )}
                </div>

                {/* Translations */}
                {showTranslations && response.translations && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <Languages className="w-4 h-4" />
                      <span>Translations:</span>
                    </h4>
                    
                    {/* Kannada Translation */}
                    {response.translations.kannada && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="text-sm font-medium text-green-800">ಕನ್ನಡ (Kannada):</p>
                              <Badge variant="outline" className="text-green-700 border-green-300">
                                {(response.translations.kannada.confidence * 100).toFixed(1)}% confidence
                              </Badge>
                            </div>
                            <p className="text-sm text-green-700 whitespace-pre-wrap leading-relaxed">
                              {response.translations.kannada.translatedText}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hindi Translation */}
                    {response.translations.hindi && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="text-sm font-medium text-orange-800">हिंदी (Hindi):</p>
                              <Badge variant="outline" className="text-orange-700 border-orange-300">
                                {(response.translations.hindi.confidence * 100).toFixed(1)}% confidence
                              </Badge>
                            </div>
                            <p className="text-sm text-orange-700 whitespace-pre-wrap leading-relaxed">
                              {response.translations.hindi.translatedText}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Response Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-gray-600">Confidence</p>
                    <p className="text-sm font-medium">{(response.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-gray-600">Model Used</p>
                    <p className="text-sm font-medium">{response.modelUsed || "Unknown"}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-gray-600">Response Type</p>
                    <p className="text-sm font-medium">
                      {response.isFallback ? "Fallback" : "Llama"}
                    </p>
                  </div>
                </div>

                {/* Suggested Actions */}
                {response.suggestedActions && response.suggestedActions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Suggested Actions:</p>
                    <div className="flex flex-wrap gap-2">
                      {response.suggestedActions.map((action, index) => (
                        <Badge key={index} variant="secondary">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Credentials */}
                {response.relatedCredentials && response.relatedCredentials.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Related Credentials:</p>
                    <div className="flex flex-wrap gap-2">
                      {response.relatedCredentials.map((credential, index) => (
                        <Badge key={index} variant="outline">
                          {credential}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scholarship Recommendations */}
                {response.scholarshipRecommendations && response.scholarshipRecommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Recommended Scholarships:</p>
                    <div className="space-y-3">
                      {response.scholarshipRecommendations.map((rec, index) => (
                        <div key={index} className="p-3 border border-green-200 rounded-lg bg-green-50">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-green-800">
                              {rec.scholarship.name}
                            </h4>
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              {rec.matchScore.toFixed(0)}% Match
                            </Badge>
                          </div>
                          <p className="text-xs text-green-700 mb-2">{rec.scholarship.description}</p>
                          <div className="text-xs text-green-600">
                            <div className="flex items-center justify-between mb-1">
                              <span>Amount:</span>
                              <span className="font-medium">{rec.scholarship.amount}</span>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span>Source:</span>
                              <span>{rec.scholarship.source}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Deadline:</span>
                              <span>{new Date(rec.scholarship.deadline).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {rec.matchReasons.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-green-800 mb-1">Why this matches:</p>
                              <ul className="text-xs text-green-700 space-y-1">
                                {rec.matchReasons.slice(0, 2).map((reason, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-green-500 mr-1">•</span>
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}