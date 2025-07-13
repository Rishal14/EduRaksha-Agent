import { NextRequest, NextResponse } from 'next/server';
import { vertexAIService } from '@/lib/vertex-ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, options } = body;

    let result: any;

    switch (type) {
      case 'translate':
        result = await vertexAIService.translateText({
          text: content.text,
          targetLanguage: content.targetLanguage,
          sourceLanguage: content.sourceLanguage
        });
        break;
      
      case 'generate':
        result = await vertexAIService.generateText({
          prompt: content.prompt,
          ...options
        });
        break;
      
      case 'multimodal':
        result = await vertexAIService.processMultimodal({
          text: content.prompt,
          image: content.imageUrl,
          ...options
        });
        break;
      
      case 'chat':
        // For now, use text generation for chat
        result = await vertexAIService.generateText({
          prompt: content.messages.map((m: any) => `${m.role}: ${m.content}`).join('\n'),
          ...options
        });
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid request type. Supported types: translate, generate, multimodal, chat' },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Vertex AI API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Vertex AI API is running',
    supportedTypes: ['translate', 'generate', 'multimodal', 'chat']
  });
} 