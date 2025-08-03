import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AI_CONFIG, ASSIGNMENT_PROMPTS, ERROR_MESSAGES } from './config';

interface LessonRequest {
  subject?: string; // Made optional
  topic: string;
  learningObjectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  requirements?: string;
  sourceType: 'manual' | 'document';
  documentContent?: string;
  classId: string; // Added classId
}

interface LessonSection {
  title: string;
  content: string;
  sectionType: string;
  order: number;
  metadata: {
    keyPoints?: string[];
    examples?: string[];
    checkpointQuestion?: string;
    documentReferences?: string[];
  };
}

interface LessonResponse {
  title: string;
  description: string;
  content: string;
  sections: LessonSection[];
  learningObjectives: string[];
  resources: string[];
  estimatedTime: number;
  keyTakeaways: string[];
}

interface ChatRequest {
  lessonContent: string;
  learningObjectives: string[];
  question: string;
}

export class LessonCreatorService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    if (!AI_CONFIG.openai.apiKey && !AI_CONFIG.anthropic.apiKey) {
      throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
    }

    if (AI_CONFIG.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: AI_CONFIG.openai.apiKey,
      });
    }

    if (AI_CONFIG.anthropic.apiKey) {
      this.anthropic = new Anthropic({
        apiKey: AI_CONFIG.anthropic.apiKey,
      });
    }
  }

  async createLesson(request: LessonRequest): Promise<LessonResponse> {
    try {
      this.validateLessonRequest(request);

      const prompt = request.documentContent 
        ? this.buildDocumentLessonPrompt(request)
        : this.buildLessonPrompt(request);

      let response: LessonResponse;
      
      try {
        response = await this.generateWithOpenAI(prompt);
      } catch (error) {
        console.warn('OpenAI failed, trying Anthropic:', error);
        response = await this.generateWithAnthropic(prompt);
      }

      return this.validateAndCleanResponse(response);
    } catch (error) {
      console.error('Lesson creation failed:', error);
      throw this.handleError(error);
    }
  }

  async chatWithAI(request: ChatRequest): Promise<string> {
    try {
      const prompt = ASSIGNMENT_PROMPTS.lessonChat
        .replace('{lessonContent}', request.lessonContent)
        .replace('{learningObjectives}', request.learningObjectives.join(', '))
        .replace('{question}', request.question);

      let response: string;
      
      try {
        response = await this.generateChatWithOpenAI(prompt);
      } catch (error) {
        console.warn('OpenAI failed, trying Anthropic:', error);
        response = await this.generateChatWithAnthropic(prompt);
      }

      return response;
    } catch (error) {
      console.error('AI chat failed:', error);
      throw this.handleError(error);
    }
  }

  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      // Use the main build instead of legacy for better compatibility
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source to CDN (more reliable for server-side)
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

      const pdfDoc = await pdfjsLib.getDocument({ 
        data: pdfBuffer
      }).promise;
      
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += `\n\nPage ${pageNum}:\n${pageText}`;
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction failed:', error);
      // More helpful error message with troubleshooting info
      if (error instanceof Error && error.message.includes('DOMMatrix')) {
        throw new Error('PDF processing is temporarily unavailable due to server configuration. Please try uploading a text file instead, or contact support.');
      }
      throw new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF document or try uploading a text file instead.');
    }
  }

  private validateLessonRequest(request: LessonRequest): void {
    // Removed subject from validation, now requires topic, learningObjectives, and classId
    if (!request.topic || !request.learningObjectives || !request.classId) {
      throw new Error(ERROR_MESSAGES.INVALID_INPUT);
    }

    if (request.learningObjectives.length === 0) {
      throw new Error('At least one learning objective is required');
    }

    if (request.duration < 15 || request.duration > 300) {
      throw new Error('Duration must be between 15 and 300 minutes');
    }

    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(request.difficulty)) {
      throw new Error(`Invalid difficulty level. Must be one of: ${validDifficulties.join(', ')}`);
    }
  }

  private buildLessonPrompt(request: LessonRequest): string {
    return ASSIGNMENT_PROMPTS.lesson
      .replace('{subject}', request.subject || '')
      .replace('{topic}', request.topic)
      .replace('{learningObjectives}', request.learningObjectives.join(', '))
      .replace('{difficulty}', request.difficulty)
      .replace('{duration}', request.duration.toString())
      .replace('{requirements}', request.requirements || 'None specified');
  }

  private buildDocumentLessonPrompt(request: LessonRequest): string {
    return ASSIGNMENT_PROMPTS.lessonFromDocument
      .replace('{documentContent}', request.documentContent || '')
      .replace('{subject}', request.subject || '')
      .replace('{topic}', request.topic)
      .replace('{learningObjectives}', request.learningObjectives.join(', '))
      .replace('{difficulty}', request.difficulty)
      .replace('{duration}', request.duration.toString())
      .replace('{requirements}', request.requirements || 'None specified');
  }

  private async generateWithOpenAI(prompt: string): Promise<LessonResponse> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const completion = await this.openai.chat.completions.create({
      model: AI_CONFIG.openai.model,
      messages: [
        { role: 'system', content: ASSIGNMENT_PROMPTS.system },
        { role: 'user', content: prompt }
      ],
      max_tokens: AI_CONFIG.openai.maxTokens,
      temperature: AI_CONFIG.openai.temperature,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return this.parseJSONResponse(content);
  }

  private async generateWithAnthropic(prompt: string): Promise<LessonResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic not configured');
    }

    const message = await this.anthropic.messages.create({
      model: AI_CONFIG.anthropic.model,
      max_tokens: AI_CONFIG.anthropic.maxTokens,
      temperature: AI_CONFIG.anthropic.temperature,
      messages: [
        { role: 'user', content: `${ASSIGNMENT_PROMPTS.system}\n\n${prompt}` }
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Invalid response type from Anthropic');
    }

    return this.parseJSONResponse(content.text);
  }

  private async generateChatWithOpenAI(prompt: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const completion = await this.openai.chat.completions.create({
      model: AI_CONFIG.openai.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  }

  private async generateChatWithAnthropic(prompt: string): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Anthropic not configured');
    }

    const message = await this.anthropic.messages.create({
      model: AI_CONFIG.anthropic.model,
      max_tokens: 1000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Invalid response type from Anthropic');
    }

    return content.text;
  }

  private parseJSONResponse(content: string): LessonResponse {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.title || !parsed.description || !parsed.content) {
        throw new Error('Missing required fields in response');
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response');
    }
  }

  private validateAndCleanResponse(response: LessonResponse): LessonResponse {
    return {
      title: response.title || 'Untitled Lesson',
      description: response.description || 'No description provided',
      content: response.content || 'No content provided',
      sections: Array.isArray(response.sections) ? response.sections : [],
      learningObjectives: Array.isArray(response.learningObjectives) ? response.learningObjectives : [],
      resources: Array.isArray(response.resources) ? response.resources : [],
      estimatedTime: response.estimatedTime || 60,
      keyTakeaways: Array.isArray(response.keyTakeaways) ? response.keyTakeaways : []
    };
  }

  private handleError(error: any): Error {
    if (error.message?.includes('rate limit')) {
      return new Error(ERROR_MESSAGES.RATE_LIMIT);
    }
    if (error.message?.includes('too long')) {
      return new Error(ERROR_MESSAGES.CONTENT_TOO_LONG);
    }
    return new Error(ERROR_MESSAGES.GENERATION_FAILED);
  }
} 