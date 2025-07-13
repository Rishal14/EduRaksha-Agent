"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Languages, Globe } from "lucide-react";
import { TranslationResponse } from "@/lib/translation-service";
import { toast } from "sonner";

export default function TranslationTestPage() {
  const [inputText, setInputText] = useState("");
  const [kannadaTranslation, setKannadaTranslation] = useState<TranslationResponse | null>(null);
  const [hindiTranslation, setHindiTranslation] = useState<TranslationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sampleTexts = [
    "Am I eligible for SC scholarship?",
    "How do I prove my income is less than ₹1,00,000?",
    "What documents do I need for scholarship application?",
    "How does privacy protection work in this system?",
    "I need help with my credentials",
    "Generate ZKP proof for my eligibility",
  ];

  const translateText = async (text: string, targetLanguage: 'kn' | 'hi') => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const result: TranslationResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  };

  const handleTranslate = async (customText?: string) => {
    const textToTranslate = customText || inputText;
    if (!textToTranslate.trim()) return;

    setIsLoading(true);
    setKannadaTranslation(null);
    setHindiTranslation(null);

    try {
      const [kannadaResult, hindiResult] = await Promise.all([
        translateText(textToTranslate, 'kn'),
        translateText(textToTranslate, 'hi'),
      ]);

      setKannadaTranslation(kannadaResult);
      setHindiTranslation(hindiResult);
      toast.success('Translation completed!');
    } catch (error) {
      console.error('Translation failed:', error);
      toast.error('Translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleText = (text: string) => {
    setInputText(text);
    handleTranslate(text);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Translation Test</h1>
        <p className="text-gray-600">
          Test English to Kannada and Hindi translation using Google Cloud Translation API
        </p>
      </div>

      {/* Translation Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Translation Interface
          </CardTitle>
          <CardDescription>
            Enter English text to translate to Kannada and Hindi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample Texts */}
            <div>
              <Label className="text-sm font-medium">Sample Texts:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {sampleTexts.map((text) => (
                  <Button
                    key={text}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSampleText(text)}
                    disabled={isLoading}
                  >
                    {text}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Text Input */}
            <div className="space-y-2">
              <Label htmlFor="inputText">Enter custom text:</Label>
              <div className="flex space-x-2">
                <Input
                  id="inputText"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter English text to translate..."
                  onKeyPress={(e) => e.key === 'Enter' && handleTranslate()}
                />
                <Button 
                  onClick={() => handleTranslate()} 
                  disabled={isLoading || !inputText.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Original Text */}
            {inputText && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-800 mb-1">Original Text (English):</p>
                <p className="text-sm text-blue-700">{inputText}</p>
              </div>
            )}

            {/* Translations */}
            {(kannadaTranslation || hindiTranslation) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Translations:</h4>
                
                {/* Kannada Translation */}
                {kannadaTranslation && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-green-800">ಕನ್ನಡ (Kannada)</p>
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            Confidence: {(kannadaTranslation.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-green-700 whitespace-pre-wrap">
                          {kannadaTranslation.translatedText}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hindi Translation */}
                {hindiTranslation && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-orange-800">हिंदी (Hindi)</p>
                          <Badge variant="outline" className="text-orange-700 border-orange-300">
                            Confidence: {(hindiTranslation.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-orange-700 whitespace-pre-wrap">
                          {hindiTranslation.translatedText}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Information */}
      <Card>
        <CardHeader>
          <CardTitle>API Information</CardTitle>
          <CardDescription>
            How to use the translation API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">POST /api/translate</h4>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-gray-700 mb-2">Request body:</p>
                <pre className="text-xs text-gray-600">
{`{
  "text": "Your English text here",
  "targetLanguage": "kn" // or "hi"
}`}
                </pre>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">GET /api/translate?text=...&targetLanguage=...</h4>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-gray-700 mb-2">Query parameters:</p>
                <pre className="text-xs text-gray-600">
{`text=Your English text here
targetLanguage=kn // or hi`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Response Format</h4>
              <div className="bg-gray-100 p-3 rounded-lg">
                <pre className="text-xs text-gray-600">
{`{
  "translatedText": "Translated text",
  "originalText": "Original text",
  "targetLanguage": "kn",
  "sourceLanguage": "en",
  "confidence": 0.95
}`}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 