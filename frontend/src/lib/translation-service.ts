export interface TranslationRequest {
  text: string;
  targetLanguage: 'kn' | 'hi'; // 'kn' for Kannada, 'hi' for Hindi
  sourceLanguage?: string;
}

export interface TranslationResponse {
  translatedText: string;
  originalText: string;
  targetLanguage: string;
  sourceLanguage: string;
  confidence?: number;
}

class TranslationService {
  private isInitialized = true;

  constructor() {
    // Browser-compatible translation service
    // All actual translation happens via API routes
    console.log('Translation service initialized (browser mode)');
  }

  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      // Try Vertex AI first (if configured)
      const vertexResponse = await fetch('/api/vertex-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'translate',
          ...request,
        }),
      });

      if (vertexResponse.ok) {
        const result: TranslationResponse = await vertexResponse.json();
        return result;
      }

      // Fallback to Google Cloud Translation API
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        console.warn('Translation API request failed, using mock translation');
        return this.mockTranslation(request);
      }

      const result: TranslationResponse = await response.json();
      return result;
    } catch (error) {
      console.warn('Translation service unavailable, using mock translation:', error);
      // Fallback to mock translation
      return this.mockTranslation(request);
    }
  }

  async translateToKannada(text: string): Promise<TranslationResponse> {
    return this.translateText({
      text,
      targetLanguage: 'kn',
      sourceLanguage: 'en',
    });
  }

  async translateToHindi(text: string): Promise<TranslationResponse> {
    return this.translateText({
      text,
      targetLanguage: 'hi',
      sourceLanguage: 'en',
    });
  }

  private mockTranslation(request: TranslationRequest): TranslationResponse {
    // Mock translations for development/testing
    const mockTranslations: Record<string, Record<string, string>> = {
      kn: {
        'Am I eligible for SC scholarship?': 'ನಾನು SC ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಅರ್ಹನೇ?',
        'How do I prove my income is less than ₹1,00,000?': 'ನನ್ನ ಆದಾಯ ₹1,00,000 ಕ್ಕಿಂತ ಕಡಿಮೆ ಎಂದು ಹೇಗೆ ಸಾಬೀತುಪಡಿಸಬೇಕು?',
        'What documents do I need?': 'ನನಗೆ ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?',
        'How does privacy protection work?': 'ಗೌಪ್ಯತೆ ರಕ್ಷಣೆ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?',
        'I need help with scholarship application': 'ನನಗೆ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಗೆ ಸಹಾಯ ಬೇಕು',
        'Check my eligibility': 'ನನ್ನ ಅರ್ಹತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ',
        'Generate ZKP proof': 'ZKP ಪುರಾವೆ ರಚಿಸಿ',
        'View my credentials': 'ನನ್ನ ಅಧಿಕಾರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
      },
      hi: {
        'Am I eligible for SC scholarship?': 'क्या मैं SC छात्रवृत्ति के लिए पात्र हूं?',
        'How do I prove my income is less than ₹1,00,000?': 'मैं कैसे साबित करूं कि मेरी आय ₹1,00,000 से कम है?',
        'What documents do I need?': 'मुझे कौन से दस्तावेज चाहिए?',
        'How does privacy protection work?': 'गोपनीयता सुरक्षा कैसे काम करती है?',
        'I need help with scholarship application': 'मुझे छात्रवृत्ति आवेदन में मदद चाहिए',
        'Check my eligibility': 'मेरी पात्रता की जांच करें',
        'Generate ZKP proof': 'ZKP प्रमाण उत्पन्न करें',
        'View my credentials': 'मेरे प्रमाणपत्र देखें',
      },
    };

    const translatedText = mockTranslations[request.targetLanguage]?.[request.text] || 
      `[Translated to ${request.targetLanguage === 'kn' ? 'Kannada' : 'Hindi'}: ${request.text}]`;

    return {
      translatedText,
      originalText: request.text,
      targetLanguage: request.targetLanguage,
      sourceLanguage: request.sourceLanguage || 'en',
      confidence: 0.8,
    };
  }

  // Helper method to detect if text is in English
  isEnglishText(text: string): boolean {
    // Simple heuristic: check if text contains mostly English characters
    const englishRegex = /^[a-zA-Z\s.,!?;:'"()-]+$/;
    return englishRegex.test(text.trim());
  }

  // Helper method to get language name
  getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'en': 'English',
      'kn': 'Kannada',
      'hi': 'Hindi',
    };
    return languages[code] || code;
  }
}

export const translationService = new TranslationService(); 