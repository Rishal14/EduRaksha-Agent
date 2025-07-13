import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ollamaManager } from "./ollama-config";
import { translationService, TranslationResponse } from "./translation-service";
import { scholarshipScraper, UserProfile, ScholarshipRecommendation } from "./scholarship-scraper";

export interface AIResponse {
  answer: string;
  confidence: number;
  suggestedActions: string[];
  relatedCredentials: string[];
  modelUsed?: string;
  isFallback?: boolean;
  translations?: {
    kannada?: TranslationResponse;
    hindi?: TranslationResponse;
  };
  scholarshipRecommendations?: ScholarshipRecommendation[];
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

class EduRakshaAI {
  private model: ChatOllama | null = null;
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

Always prioritize privacy and guide students to use ZKPs rather than sharing raw data.`;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Check if Ollama is available
      const isConnected = await ollamaManager.checkConnection();
      if (!isConnected) {
        console.warn("Ollama not available, will use fallback responses");
        this.isInitialized = true;
        return false;
      }

      // Get available models
      const availableModels = await ollamaManager.getAvailableModels();
      const config = ollamaManager.getConfig();
      
      // Check if the configured model is available
      if (!availableModels.includes(config.model)) {
        console.warn(`Model ${config.model} not available, trying to pull...`);
        const pulled = await ollamaManager.pullModel(config.model);
        if (!pulled) {
          console.warn(`Failed to pull ${config.model}, using fallback`);
          this.isInitialized = true;
          return false;
        }
      }

      // Initialize the model
      this.model = new ChatOllama({
        model: config.model,
        baseUrl: config.baseUrl,
        temperature: config.temperature,
      });

      this.isInitialized = true;
      console.log(`AI Assistant initialized with model: ${config.model}`);
      return true;
    } catch (error) {
      console.error("Failed to initialize AI Assistant:", error);
      this.isInitialized = true;
      return false;
    }
  }

  async query(question: string, context?: StudentContext): Promise<AIResponse> {
    // Ensure initialization
    if (!this.isInitialized) {
      await this.initialize();
    }

    let aiResponse: AIResponse;

    // Try to use Llama if available
    if (this.model) {
      try {
        const messages = [
          new SystemMessage(this.systemPrompt),
          new HumanMessage(this.generateContextualQuestion(question, context))
        ];

        const response = await this.model.invoke(messages);
        const config = ollamaManager.getConfig();
        
        aiResponse = {
          ...this.parseResponse(response.content as string),
          modelUsed: config.model,
          isFallback: false
        };
      } catch (error) {
        console.error("Llama query failed, falling back to mock response:", error);
        const mockResponse = await this.mockQuery(question);
        aiResponse = {
          ...mockResponse,
          modelUsed: "fallback",
          isFallback: true
        };
      }
    } else {
      // Fallback to mock response
      const mockResponse = await this.mockQuery(question);
      aiResponse = {
        ...mockResponse,
        modelUsed: "fallback",
        isFallback: true
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
        // Continue without translations - this is not a critical error
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

  private generateContextualQuestion(question: string, context?: StudentContext): string {
    let contextualQuestion = `Student Question: "${question}"\n\n`;
    
    if (context) {
      contextualQuestion += `Student Context:\n`;
      if (context.credentials.length > 0) {
        contextualQuestion += `- Has ${context.credentials.length} credentials in wallet\n`;
        contextualQuestion += `- Credential types: ${context.credentials.map(c => c.type).join(', ')}\n`;
      }
      if (context.verificationHistory.length > 0) {
        contextualQuestion += `- Has ${context.verificationHistory.length} previous verifications\n`;
      }
    }

    contextualQuestion += `\nPlease provide a helpful, privacy-focused response that guides the student appropriately.`;
    
    return contextualQuestion;
  }

  private parseResponse(response: string): AIResponse {
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
    const positiveKeywords = ['eligible', 'can', 'able', 'successful', 'valid'];
    const negativeKeywords = ['not eligible', 'cannot', 'unable', 'invalid'];
    
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

  private getFallbackResponse(question: string): AIResponse {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('eligible') || lowerQuestion.includes('scholarship')) {
      return {
        answer: "I can help you check your eligibility! To determine if you're eligible for scholarships, I'll need to verify your credentials using Zero-Knowledge Proofs. This way, you can prove your eligibility without revealing your actual personal data. Would you like me to guide you through generating a ZKP for your credentials?",
        confidence: 0.8,
        suggestedActions: ['Generate ZKP Proof', 'View SSI Wallet'],
        relatedCredentials: ['IncomeCredential', 'CasteCredential', 'EducationalCredential']
      };
    }
    
    if (lowerQuestion.includes('how') && lowerQuestion.includes('prove')) {
      return {
        answer: "To prove your credentials while maintaining privacy, you'll use Zero-Knowledge Proofs (ZKPs). Here's how: 1) Select the credential from your SSI Wallet, 2) Choose what you want to prove (e.g., 'income < ₹1,00,000'), 3) Generate a ZKP that proves the claim without revealing the actual value, 4) Submit the proof for verification. This ensures your privacy while proving eligibility!",
        confidence: 0.9,
        suggestedActions: ['Generate ZKP Proof', 'View SSI Wallet'],
        relatedCredentials: ['IncomeCredential', 'CasteCredential']
      };
    }
    
    return {
      answer: "I'm here to help you with your privacy-preserving verification needs! I can assist with scholarship eligibility, credential verification, and guide you through using Zero-Knowledge Proofs to protect your data. What specific question do you have about your credentials or the verification process?",
      confidence: 0.7,
      suggestedActions: ['View SSI Wallet', 'Ask Follow-up Question'],
      relatedCredentials: []
    };
  }

  // Mock function for when AI service is not available
  async mockQuery(question: string): Promise<AIResponse> {
    const responses: { [key: string]: AIResponse } = {
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
    if (lowerQuestion.includes('marks') || lowerQuestion.includes('percentage')) {
      return responses.marks;
    }
    
    return responses.scholarship;
  }

  // Check if the question is about scholarships
  private isScholarshipQuestion(question: string): boolean {
    const scholarshipKeywords = [
      'scholarship', 'scholarships', 'eligible', 'eligibility', 'apply', 'application',
      'funding', 'financial aid', 'grant', 'bursary', 'fellowship', 'stipend'
    ];
    
    const lowerQuestion = question.toLowerCase();
    return scholarshipKeywords.some(keyword => lowerQuestion.includes(keyword));
  }

  // Extract user profile from context
  private extractUserProfile(context?: StudentContext): UserProfile {
    if (!context || !context.credentials) {
      return {};
    }

    const profile: UserProfile = {};

    for (const credential of context.credentials) {
      switch (credential.type) {
        case 'IncomeCredential':
          const income = credential.claims.annualIncome;
          if (income) {
            profile.income = parseInt(income.toString().replace(/[^\d]/g, ''));
          }
          break;
        
        case 'CasteCredential':
          profile.caste = credential.claims.caste as string;
          break;
        
        case 'EducationalCredential':
          const marks = credential.claims.percentage;
          if (marks) {
            profile.marks = parseInt(marks.toString());
          }
          break;
        
        case 'RegionCredential':
          profile.region = credential.claims.region as 'rural' | 'urban';
          break;
        
        case 'DisabilityCredential':
          profile.disability = credential.claims.hasDisability as boolean;
          break;
      }
    }

    return profile;
  }
}

export const aiAssistant = new EduRakshaAI(); 