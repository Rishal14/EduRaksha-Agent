import { VertexAI } from '@google-cloud/vertexai';

export interface VertexAIConfig {
  projectId: string;
  location: string;
  apiEndpoint?: string;
}

export interface TranslationRequest {
  text: string;
  targetLanguage: 'kn' | 'hi' | 'ta' | 'te' | 'ml' | 'bn' | 'gu' | 'mr' | 'pa' | 'or';
  sourceLanguage?: string;
}

export interface TranslationResponse {
  translatedText: string;
  originalText: string;
  targetLanguage: string;
  sourceLanguage: string;
  confidence?: number;
  modelUsed: string;
}

export interface TextGenerationRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  model?: string;
}

export interface TextGenerationResponse {
  text: string;
  modelUsed: string;
  usage?: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
}

export interface MultimodalRequest {
  text: string;
  image?: string; // base64 encoded image
  maxTokens?: number;
  temperature?: number;
}

export interface MultimodalResponse {
  text: string;
  modelUsed: string;
  confidence?: number;
}

class VertexAIService {
  private vertexAI: VertexAI | null = null;
  private config: VertexAIConfig;
  private isInitialized = false;

  constructor() {
    this.config = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      apiEndpoint: process.env.GOOGLE_CLOUD_API_ENDPOINT,
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      if (!this.config.projectId) {
        console.warn('Vertex AI: No project ID configured, using mock responses');
        this.isInitialized = false;
        return;
      }

      this.vertexAI = new VertexAI({
        project: this.config.projectId,
        location: this.config.location,
        apiEndpoint: this.config.apiEndpoint,
      });

      this.isInitialized = true;
      console.log('Vertex AI initialized successfully');
    } catch (error) {
      console.warn('Vertex AI initialization failed:', error);
      this.isInitialized = false;
    }
  }

  // Translation using Vertex AI's advanced models
  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    if (!this.isInitialized || !this.vertexAI) {
      return this.mockTranslation(request);
    }

    try {
      const model = 'gemini-1.5-flash';
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: model,
        generation_config: {
          max_output_tokens: 2048,
          temperature: 0.1,
        },
      });

      const prompt = `Translate the following English text to ${this.getLanguageName(request.targetLanguage)}. 
      Provide only the translation, no explanations or additional text.
      
      Text to translate: "${request.text}"
      
      Translation:`;

      const result = await generativeModel.generateContent(prompt);
      const translatedText = result.response.text().trim();

      return {
        translatedText,
        originalText: request.text,
        targetLanguage: request.targetLanguage,
        sourceLanguage: request.sourceLanguage || 'en',
        confidence: 0.95,
        modelUsed: model,
      };
    } catch (error) {
      console.warn('Vertex AI translation failed, using mock:', error);
      return this.mockTranslation(request);
    }
  }

  // Text generation using Vertex AI
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    if (!this.isInitialized || !this.vertexAI) {
      return this.mockTextGeneration(request);
    }

    try {
      const model = request.model || 'gemini-1.5-flash';
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: model,
        generation_config: {
          max_output_tokens: request.maxTokens || 2048,
          temperature: request.temperature || 0.7,
          top_p: request.topP || 0.8,
          top_k: request.topK || 40,
        },
      });

      const result = await generativeModel.generateContent(request.prompt);
      const generatedText = result.response.text();

      return {
        text: generatedText,
        modelUsed: model,
        usage: {
          promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
          responseTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      console.warn('Vertex AI text generation failed, using mock:', error);
      return this.mockTextGeneration(request);
    }
  }

  // Multimodal processing (text + image)
  async processMultimodal(request: MultimodalRequest): Promise<MultimodalResponse> {
    if (!this.isInitialized || !this.vertexAI) {
      return this.mockMultimodal(request);
    }

    try {
      const model = 'gemini-1.5-flash';
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: model,
        generation_config: {
          max_output_tokens: request.maxTokens || 2048,
          temperature: request.temperature || 0.3,
        },
      });

      const content: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [{ text: request.text }];
      
      if (request.image) {
        content.push({
          inlineData: {
            data: request.image,
            mimeType: 'image/jpeg',
          },
        });
      }

      const result = await generativeModel.generateContent(content);
      const responseText = result.response.text();

      return {
        text: responseText,
        modelUsed: model,
        confidence: 0.9,
      };
    } catch (error) {
      console.warn('Vertex AI multimodal processing failed, using mock:', error);
      return this.mockMultimodal(request);
    }
  }

  // Certificate processing with AI
  async processCertificate(imageBase64: string, certificateType: string): Promise<Record<string, unknown>> {
    const prompt = `Analyze this ${certificateType} certificate and extract the following information in JSON format:
    - Document type
    - Issuing authority
    - Issue date
    - Validity period
    - Key details (income amount, caste category, marks, etc.)
    - Confidence score (0-1)
    
    Provide the response as valid JSON only.`;

    const response = await this.processMultimodal({
      text: prompt,
      image: imageBase64,
      temperature: 0.1,
    });

    try {
      return JSON.parse(response.text);
    } catch (error) {
      console.warn('Failed to parse certificate analysis:', error);
      return {
        documentType: certificateType,
        confidence: 0.5,
        error: 'Failed to parse AI response',
      };
    }
  }

  // Helper methods
  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'kn': 'Kannada',
      'hi': 'Hindi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'ml': 'Malayalam',
      'bn': 'Bengali',
      'gu': 'Gujarati',
      'mr': 'Marathi',
      'pa': 'Punjabi',
      'or': 'Odia',
    };
    return languages[code] || code;
  }

  // Mock responses for fallback
  private mockTranslation(request: TranslationRequest): TranslationResponse {
    const mockTranslations: Record<string, Record<string, string>> = {
      kn: {
        'Am I eligible for SC scholarship?': 'ನಾನು SC ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಅರ್ಹನೇ?',
        'How do I prove my income is less than ₹1,00,000?': 'ನನ್ನ ಆದಾಯ ₹1,00,000 ಕ್ಕಿಂತ ಕಡಿಮೆ ಎಂದು ಹೇಗೆ ಸಾಬೀತುಪಡಿಸಬೇಕು?',
        'What documents do I need?': 'ನನಗೆ ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?',
        'How does privacy protection work?': 'ಗೌಪ್ಯತೆ ರಕ್ಷಣೆ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?',
      },
      hi: {
        'Am I eligible for SC scholarship?': 'क्या मैं SC छात्रवृत्ति के लिए पात्र हूं?',
        'How do I prove my income is less than ₹1,00,000?': 'मैं कैसे साबित करूं कि मेरी आय ₹1,00,000 से कम है?',
        'What documents do I need?': 'मुझे कौन से दस्तावेज चाहिए?',
        'How does privacy protection work?': 'गोपनीयता सुरक्षा कैसे काम करती है?',
      },
    };

    const translatedText = mockTranslations[request.targetLanguage]?.[request.text] || 
      `[Translated to ${this.getLanguageName(request.targetLanguage)}: ${request.text}]`;

    return {
      translatedText,
      originalText: request.text,
      targetLanguage: request.targetLanguage,
      sourceLanguage: request.sourceLanguage || 'en',
      confidence: 0.8,
      modelUsed: 'mock',
    };
  }

  private mockTextGeneration(request: TextGenerationRequest): TextGenerationResponse {
    return {
      text: `[Mock response for: ${request.prompt.substring(0, 50)}...]`,
      modelUsed: 'mock',
      usage: {
        promptTokens: request.prompt.length,
        responseTokens: 50,
        totalTokens: request.prompt.length + 50,
      },
    };
  }

  private mockMultimodal(request: MultimodalRequest): MultimodalResponse {
    return {
      text: `[Mock multimodal response for: ${request.text.substring(0, 50)}...]`,
      modelUsed: 'mock',
      confidence: 0.5,
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    return this.isInitialized;
  }

  // Get available models
  async getAvailableModels(): Promise<string[]> {
    if (!this.isInitialized) {
      return ['mock'];
    }

    return [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
      'text-bison',
      'chat-bison',
    ];
  }
}

export const vertexAIService = new VertexAIService(); 