"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { aiAssistant, type AIResponse } from "@/lib/ai-assistant";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  aiResponse?: AIResponse;
}

const sampleQuestions = [
  "Am I eligible for the SC scholarship?",
  "What documents do I need for income verification?",
  "How do I prove my marks without revealing the exact percentage?",
  "Can I apply for multiple scholarships with the same proof?",
  "What is the deadline for the rural student scholarship?"
];

// Removed mockResponses as it's no longer needed with AI integration

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your EduRaksha AI Assistant. I can help you with scholarship eligibility, document requirements, and privacy-preserving verification. How can I assist you today?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Removed generateResponse function as it's no longer needed

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      timestamp: new Date(),
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Get AI response
      const aiResponse = await aiAssistant.query(inputValue);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.answer,
        sender: 'assistant',
        timestamp: new Date(),
        aiResponse
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      // Fallback to mock response
      const fallbackResponse = await aiAssistant.mockQuery(inputValue);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackResponse.answer,
        sender: 'assistant',
        timestamp: new Date(),
        aiResponse: fallbackResponse
      };

      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Generate ZKP Proof':
        window.location.href = '/zkp-generator';
        break;
      case 'View SSI Wallet':
        window.location.href = '/wallet';
        break;
      case 'Submit for Verification':
        window.location.href = '/verifier';
        break;
      case 'Check Eligibility':
        // Could trigger eligibility check
        console.log('Checking eligibility...');
        break;
      default:
        console.log('Action:', action);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          AI Assistant
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Ask questions about scholarship eligibility, document requirements, and privacy-preserving verification. 
          Your AI assistant is here to help!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span>EduRaksha Assistant</span>
                <Badge variant="secondary" className="ml-auto">Online</Badge>
              </CardTitle>
              <CardDescription>
                Ask me anything about scholarships and privacy-preserving verification
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border shadow-sm'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      
                      {/* AI Response Actions */}
                      {message.sender === 'assistant' && message.aiResponse && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">
                              Confidence: {Math.round(message.aiResponse.confidence * 100)}%
                            </span>
                            {message.aiResponse.relatedCredentials.length > 0 && (
                              <div className="flex space-x-1">
                                {message.aiResponse.relatedCredentials.slice(0, 2).map((cred, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {cred.replace('Credential', '')}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {message.aiResponse.suggestedActions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {message.aiResponse.suggestedActions.map((action, index) => (
                                <Button
                                  key={index}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-6 px-2"
                                  onClick={() => handleQuickAction(action)}
                                >
                                  {action}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border shadow-sm p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your question here..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                >
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Questions</CardTitle>
              <CardDescription>
                Click to ask common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sampleQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Chat Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Messages:</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Your Questions:</span>
                  <span className="font-medium">
                    {messages.filter(m => m.sender === 'user').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">AI Responses:</span>
                  <span className="font-medium">
                    {messages.filter(m => m.sender === 'assistant').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>I can help you with:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Scholarship eligibility</li>
                  <li>Document requirements</li>
                  <li>ZKP proof generation</li>
                  <li>Privacy protection</li>
                  <li>Application deadlines</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 