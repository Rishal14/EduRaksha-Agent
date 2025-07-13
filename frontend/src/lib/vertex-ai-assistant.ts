import { vertexAIService, TextGenerationRequest, TextGenerationResponse } from './vertex-ai-service';
import { translationService, TranslationResponse } from './translation-service';
import { scholarshipScraper, UserProfile, ScholarshipRecommendation } from './scholarship-scraper';

export interface VertexAIResponse {
  answer: string;
  confidence: number;
  suggestedActions: string[];
  relatedCredentials: string[];
  modelUsed: string;
  isFallback?: boolean;
  translations?: {
    kannada?: TranslationResponse;
    hindi?: TranslationResponse;
  };
  scholarshipRecommendations?: ScholarshipRecommendation[];
  usage?: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
}

export interface StudentContext {
  credentials: Array<{
    type: string;
    id: string;
    claims: Record<string, unknown>;
  }>;
  eligibilityQueries: string[];
  verificationHistory: Array<{
    type: string;
    timestamp: string;
    status: string;
  }>;
}

class VertexAIAssistant {
  private systemPrompt: string;
  private isInitialized = false;

  constructor() {
    this.systemPrompt = `You are EduRaksha AI Assistant, a helpful guide for students using a privacy-preserving verification system.

Your role is to:
1. Help students understand their eligibility for scholarships and programs
2. Guide them through the ZKP (Zero-Knowledge Proof) generation process
3. Explain how to use their SSI Wallet and Verifiable Credentials
4. Provide privacy-preserving advice without revealing sensitive data

Key concepts:
- ZKP: Zero-Knowledge Proofs allow proving eligibility without revealing actual values
- SSI Wallet: Self-Sovereign Identity wallet where students store their credentials
- Verifiable Credentials: Digitally signed credentials from trusted authorities
- Privacy-first: Students control their data and can prove claims without revealing raw data

Available credential types:
- Educational Credentials (marks, certificates)
- Income Credentials (family income)
- Caste Credentials (reservation category)
- Disability Credentials (physical disability status)
- Region Credentials (rural/urban classification)

Common queries you can help with:
- "Am I eligible for SC scholarship?" - Check caste credential and guide ZKP generation
- "How do I prove my income is less than ₹1,00,000?" - Explain ZKP process for income claims
- "What documents do I need?" - List required credentials for different programs
- "How does privacy protection work?" - Explain ZKP and SSI concepts

Always prioritize privacy and guide students to use ZKPs rather than sharing raw data.

Provide clear, actionable responses with specific next steps.`;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      const isHealthy = await vertexAIService.healthCheck();
      this.isInitialized = true;
      
      if (isHealthy) {
        console.log('Vertex AI Assistant initialized successfully');
        return true;
      } else {
        console.warn('Vertex AI not available, will use fallback responses');
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize Vertex AI Assistant:', error);
      this.isInitialized = true;
      return false;
    }
  }

  async query(question: string, context?: StudentContext): Promise<VertexAIResponse> {
    // Ensure initialization
    if (!this.isInitialized) {
      await this.initialize();
    }

    let aiResponse: VertexAIResponse;

    // Try to use Vertex AI if available
    const isHealthy = await vertexAIService.healthCheck();
    if (isHealthy) {
      try {
        const prompt = this.generateContextualPrompt(question, context);
        
        const generationRequest: TextGenerationRequest = {
          prompt,
          maxTokens: 2048,
          temperature: 0.7,
          model: 'gemini-1.5-flash',
        };

        const response: TextGenerationResponse = await vertexAIService.generateText(generationRequest);
        
        aiResponse = {
          ...this.parseResponse(response.text),
          modelUsed: response.modelUsed,
          isFallback: false,
          usage: response.usage,
        };
      } catch (error) {
        console.error('Vertex AI query failed, falling back to mock response:', error);
        aiResponse = {
          ...this.mockQuery(question),
          modelUsed: 'fallback',
          isFallback: true,
        };
      }
    } else {
      // Fallback to mock response
      aiResponse = {
        ...this.mockQuery(question),
        modelUsed: 'fallback',
        isFallback: true,
      };
    }

    // Add translations if the question is in English
    if (translationService.isEnglishText(question)) {
      try {
        const [kannadaTranslation, hindiTranslation] = await Promise.all([
          translationService.translateToKannada(aiResponse.answer),
          translationService.translateToHindi(aiResponse.answer)
        ]);

        aiResponse.translations = {
          kannada: kannadaTranslation,
          hindi: hindiTranslation
        };
      } catch {
        console.warn("Translation service unavailable, continuing without translations");
      }
    }

    // Add scholarship recommendations if the question is about scholarships
    if (this.isScholarshipQuestion(question)) {
      try {
        const userProfile = this.extractUserProfile(context);
        const recommendations = await scholarshipScraper.getRecommendations(userProfile);
        aiResponse.scholarshipRecommendations = recommendations.slice(0, 3); // Top 3 recommendations
      } catch (error) {
        console.error("Scholarship recommendations failed:", error);
      }
    }

    return aiResponse;
  }

  private generateContextualPrompt(question: string, context?: StudentContext): string {
    let prompt = `${this.systemPrompt}\n\n`;
    
    prompt += `Student Question: "${question}"\n\n`;
    
    if (context) {
      prompt += `Student Context:\n`;
      if (context.credentials.length > 0) {
        prompt += `- Has ${context.credentials.length} credentials in wallet\n`;
        prompt += `- Credential types: ${context.credentials.map(c => c.type).join(', ')}\n`;
      }
      if (context.verificationHistory.length > 0) {
        prompt += `- Has ${context.verificationHistory.length} previous verifications\n`;
      }
    }

    prompt += `\nPlease provide a helpful, privacy-focused response that guides the student appropriately.`;
    
    return prompt;
  }

  private parseResponse(response: string): Omit<VertexAIResponse, 'modelUsed' | 'isFallback' | 'usage'> {
    // Parse AI response and extract structured information
    const confidence = this.extractConfidence(response);
    const suggestedActions = this.extractSuggestedActions(response);
    const relatedCredentials = this.extractRelatedCredentials(response);

    return {
      answer: response,
      confidence,
      suggestedActions,
      relatedCredentials
    };
  }

  private extractConfidence(response: string): number {
    // Simple confidence extraction based on response length and keywords
    const positiveKeywords = ['eligible', 'can', 'able', 'successful', 'valid', 'help', 'guide'];
    const negativeKeywords = ['not eligible', 'cannot', 'unable', 'invalid', 'sorry'];
    
    const positiveCount = positiveKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    ).length;
    const negativeCount = negativeKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    ).length;
    
    const baseConfidence = Math.min(0.9, 0.5 + (positiveCount * 0.1) - (negativeCount * 0.1));
    return Math.max(0.1, baseConfidence);
  }

  private extractSuggestedActions(response: string): string[] {
    const actions: string[] = [];
    
    if (response.toLowerCase().includes('generate zkp') || response.toLowerCase().includes('proof')) {
      actions.push('Generate ZKP Proof');
    }
    if (response.toLowerCase().includes('wallet') || response.toLowerCase().includes('credential')) {
      actions.push('View SSI Wallet');
    }
    if (response.toLowerCase().includes('verify') || response.toLowerCase().includes('submit')) {
      actions.push('Submit for Verification');
    }
    if (response.toLowerCase().includes('scholarship') || response.toLowerCase().includes('apply')) {
      actions.push('Check Eligibility');
    }
    
    return actions.length > 0 ? actions : ['Ask Follow-up Question'];
  }

  private extractRelatedCredentials(response: string): string[] {
    const credentials: string[] = [];
    
    if (response.toLowerCase().includes('income') || response.toLowerCase().includes('salary')) {
      credentials.push('IncomeCredential');
    }
    if (response.toLowerCase().includes('caste') || response.toLowerCase().includes('sc') || response.toLowerCase().includes('st')) {
      credentials.push('CasteCredential');
    }
    if (response.toLowerCase().includes('marks') || response.toLowerCase().includes('percentage') || response.toLowerCase().includes('grade')) {
      credentials.push('EducationalCredential');
    }
    if (response.toLowerCase().includes('disability') || response.toLowerCase().includes('handicap')) {
      credentials.push('DisabilityCredential');
    }
    if (response.toLowerCase().includes('rural') || response.toLowerCase().includes('urban')) {
      credentials.push('RegionCredential');
    }
    
    return credentials;
  }

  async mockQuery(question: string): Promise<Omit<VertexAIResponse, 'modelUsed' | 'isFallback' | 'usage'>> {
    const responses: { [key: string]: Omit<VertexAIResponse, 'modelUsed' | 'isFallback' | 'usage'> } = {
      "scholarship": {
        answer: "Based on your credentials, you appear eligible for several scholarships! To verify your eligibility while protecting your privacy, you can generate Zero-Knowledge Proofs for your income, caste, and educational credentials. This proves your eligibility without revealing your actual personal data. Would you like me to guide you through the ZKP generation process?",
        confidence: 0.85,
        suggestedActions: ['Generate ZKP Proof', 'View SSI Wallet'],
        relatedCredentials: ['IncomeCredential', 'CasteCredential', 'EducationalCredential']
      },
      "income": {
        answer: "To prove your income eligibility (e.g., 'income < ₹1,00,000'), you can generate a Zero-Knowledge Proof from your Income Credential. This will prove that your income meets the requirement without revealing the exact amount. The process is: 1) Select your Income Credential from your SSI Wallet, 2) Choose the income threshold, 3) Generate the ZKP, 4) Submit for verification. This maintains your privacy while proving eligibility!",
        confidence: 0.9,
        suggestedActions: ['Generate ZKP Proof', 'View SSI Wallet'],
        relatedCredentials: ['IncomeCredential']
      },
      "caste": {
        answer: "For caste-based scholarships, you can generate a ZKP proving your caste category (e.g., SC/ST) without revealing your exact caste certificate details. This is done by: 1) Selecting your Caste Credential from your SSI Wallet, 2) Choosing the caste category to prove, 3) Generating a privacy-preserving proof, 4) Submitting for verification. This protects your privacy while proving eligibility!",
        confidence: 0.9,
        suggestedActions: ['Generate ZKP Proof', 'View SSI Wallet'],
        relatedCredentials: ['CasteCredential']
      },
      "marks": {
        answer: "To prove your academic eligibility (e.g., 'marks > 75%'), you can generate a ZKP from your Educational Credential. This proves you meet the academic requirements without revealing your exact percentage. The process: 1) Select your Educational Credential, 2) Choose the marks threshold, 3) Generate the ZKP, 4) Submit for verification. This maintains privacy while proving academic eligibility!",
        confidence: 0.9,
        suggestedActions: ['Generate ZKP Proof', 'View SSI Wallet'],
        relatedCredentials: ['EducationalCredential']
      }
    };

    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('scholarship') || lowerQuestion.includes('eligible')) {
      return responses.scholarship;
    }
    if (lowerQuestion.includes('income') || lowerQuestion.includes('salary')) {
      return responses.income;
    }
    if (lowerQuestion.includes('caste') || lowerQuestion.includes('sc') || lowerQuestion.includes('st')) {
      return responses.caste;
    }
    if (lowerQuestion.includes('marks') || lowerQuestion.includes('percentage') || lowerQuestion.includes('grade')) {
      return responses.marks;
    }
    
    return {
      answer: "I'm here to help you with your privacy-preserving verification needs! I can assist with scholarship eligibility, credential verification, and guide you through using Zero-Knowledge Proofs to protect your data. What specific question do you have about your credentials or the verification process?",
      confidence: 0.7,
      suggestedActions: ['View SSI Wallet', 'Ask Follow-up Question'],
      relatedCredentials: []
    };
  }

  private isScholarshipQuestion(question: string): boolean {
    const scholarshipKeywords = ['scholarship', 'eligible', 'apply', 'funding', 'grant', 'financial aid'];
    return scholarshipKeywords.some(keyword => 
      question.toLowerCase().includes(keyword)
    );
  }

  private extractUserProfile(context?: StudentContext): UserProfile {
    return {
      income: 90000, // Default values for demo
      caste: 'SC',
      marks: 85,
      region: 'rural',
      disability: false,
      ...context?.credentials.reduce((acc, cred) => {
        if (cred.type === 'IncomeCredential') {
          acc.income = (cred.claims.amount as number) || acc.income;
        }
        if (cred.type === 'CasteCredential') {
          acc.caste = (cred.claims.category as string) || acc.caste;
        }
        if (cred.type === 'EducationalCredential') {
          acc.marks = (cred.claims.percentage as number) || acc.marks;
        }
        return acc;
      }, {} as UserProfile)
    };
  }

  // Certificate processing using Vertex AI
  async processCertificate(imageBase64: string, certificateType: string): Promise<any> {
    return await vertexAIService.processCertificate(imageBase64, certificateType);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    return await vertexAIService.healthCheck();
  }

  // Get available models
  async getAvailableModels(): Promise<string[]> {
    return await vertexAIService.getAvailableModels();
  }
}

export const vertexAIAssistant = new VertexAIAssistant(); 