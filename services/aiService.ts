import { SubscriptionService } from './subscriptionService';

interface AIResponse {
  success: boolean;
  content: string;
  error?: string;
}

export class AIService {
  private static apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
  private static baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  static async askQuestion(question: string, bookContent: string, bookTitle: string, page?: number): Promise<AIResponse> {
    try {
      // Check subscription access
      const subscription = await SubscriptionService.getCurrentSubscription();
      if (!subscription?.hasAI) {
        return {
          success: false,
          content: '',
          error: 'AI features require a paid subscription. Upgrade to Basic ($5/month) or higher to access AI explanations and summaries.',
        };
      }

      if (!this.apiKey) {
        return {
          success: false,
          content: '',
          error: 'AI service not configured. Please check your API key settings.',
        };
      }

      const pageContext = page ? ` (Page ${page})` : '';
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a helpful reading assistant for the book "${bookTitle}". Provide clear, concise answers about the book content. Focus on explanations, summaries, and insights that help the reader understand better.`,
            },
            {
              role: 'user',
              content: `Book: ${bookTitle}${pageContext}\n\nContent context: ${bookContent.substring(0, 2000)}...\n\nQuestion: ${question}`,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || 'No response received';

      return {
        success: true,
        content,
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'AI request failed',
      };
    }
  }

  static async summarizePage(pageContent: string, bookTitle: string, page: number): Promise<AIResponse> {
    return this.askQuestion(
      `Please provide a concise summary of this page (${page}).`,
      pageContent,
      bookTitle,
      page
    );
  }

  static async explainConcept(concept: string, bookContent: string, bookTitle: string): Promise<AIResponse> {
    return this.askQuestion(
      `Please explain the concept of "${concept}" as mentioned in this book.`,
      bookContent,
      bookTitle
    );
  }
}