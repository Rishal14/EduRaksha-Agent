"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { aiAssistant } from "@/lib/ai-assistant";
import { ollamaManager } from "@/lib/ollama-config";
import { toast } from "sonner";

export default function AITestPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
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
        toast.error(`Failed to pull model ${modelName}`);
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
          AI Assistant Test
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Test the Llama AI integration for the EduRaksha AI Assistant
        </p>
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
                      The AI Assistant will fall back to mock responses.
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
          <CardTitle>Ask the AI Assistant</CardTitle>
          <CardDescription>
            Test the AI assistant with questions about scholarships and privacy
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
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-2">AI Response:</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{response.answer}</p>
                    </div>
                  </div>
                </div>

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
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            How to get Ollama and Llama models working
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Install Ollama</h4>
              <p className="text-gray-600">
                Download and install Ollama from <a href="https://ollama.ai" className="text-blue-600 hover:underline">ollama.ai</a>
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Start Ollama</h4>
              <p className="text-gray-600">
                Run <code className="bg-gray-100 px-1 rounded">ollama serve</code> in your terminal
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Pull a Model</h4>
              <p className="text-gray-600">
                Run <code className="bg-gray-100 px-1 rounded">ollama pull llama3.2</code> to download the model
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">4. Test</h4>
              <p className="text-gray-600">
                Refresh this page and check the Ollama status above
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 