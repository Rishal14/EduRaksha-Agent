import { NextRequest, NextResponse } from 'next/server';
import { Translate } from '@google-cloud/translate/build/src/v2';

// Server-side translation service
class ServerTranslationService {
  private translate: Translate | null = null;
  private isInitialized = false;

  constructor() {
    try {
      const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (apiKey) {
        this.translate = new Translate({
          projectId: projectId || 'your-project-id',
          key: apiKey,
        });
        console.log('Google Cloud Translation initialized with API key');
      } else if (keyFilename) {
        this.translate = new Translate({
          projectId: projectId || 'your-project-id',
          keyFilename: keyFilename,
        });
        console.log('Google Cloud Translation initialized with service account');
      } else {
        console.warn('No Google Cloud credentials found. Using mock translations.');
        this.translate = null;
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('Google Cloud Translation not initialized:', error);
      this.isInitialized = false;
    }
  }

  async translateText(text: string, targetLanguage: 'kn' | 'hi', sourceLanguage: string = 'en') {
    if (!this.isInitialized || !this.translate) {
      return this.mockTranslation(text, targetLanguage, sourceLanguage);
    }

    try {
      const [translation] = await this.translate.translate(text, {
        from: sourceLanguage,
        to: targetLanguage,
      });

      return {
        translatedText: translation,
        originalText: text,
        targetLanguage,
        sourceLanguage,
        confidence: 0.95,
      };
    } catch (error) {
      console.error('Translation failed:', error);
      return this.mockTranslation(text, targetLanguage, sourceLanguage);
    }
  }

  private mockTranslation(text: string, targetLanguage: 'kn' | 'hi', sourceLanguage: string) {
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

    const translatedText = mockTranslations[targetLanguage]?.[text] || 
      `[Translated to ${targetLanguage === 'kn' ? 'Kannada' : 'Hindi'}: ${text}]`;

    return {
      translatedText,
      originalText: text,
      targetLanguage,
      sourceLanguage,
      confidence: 0.8,
    };
  }
}

const serverTranslationService = new ServerTranslationService();

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and targetLanguage are required' },
        { status: 400 }
      );
    }

    if (!['kn', 'hi'].includes(targetLanguage)) {
      return NextResponse.json(
        { error: 'Target language must be "kn" (Kannada) or "hi" (Hindi)' },
        { status: 400 }
      );
    }

    const translation = await serverTranslationService.translateText(
      text,
      targetLanguage as 'kn' | 'hi',
      'en'
    );

    return NextResponse.json(translation);
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const targetLanguage = searchParams.get('targetLanguage');

  if (!text || !targetLanguage) {
    return NextResponse.json(
      { error: 'Text and targetLanguage query parameters are required' },
      { status: 400 }
    );
  }

  if (!['kn', 'hi'].includes(targetLanguage)) {
    return NextResponse.json(
      { error: 'Target language must be "kn" (Kannada) or "hi" (Hindi)' },
      { status: 400 }
    );
  }

  try {
    const translation = await serverTranslationService.translateText(
      text,
      targetLanguage as 'kn' | 'hi',
      'en'
    );

    return NextResponse.json(translation);
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
} 