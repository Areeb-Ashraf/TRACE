import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AI_CONFIG, ASSIGNMENT_PROMPTS, ERROR_MESSAGES } from './config';

interface AssignmentRequest {
  subject: string;
  topic: string;
  learningObjectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'essay' | 'project' | 'presentation' | 'research' | 'discussion' | 'quiz';
  duration: number;
  requirements?: string;
}

interface AssignmentResponse {
  title: string;
  description: string;
  instructions: string;
  rubric: {
    criteria: Array<{
      name: string;
      excellent: string;
      good: string;
      satisfactory: string;
      needsImprovement: string;
      points: number;
    }>;
    totalPoints: number;
  };
  resources: string[];
  learningOutcomes: string[];
  tips: string[];
  extensions: string[];
  estimatedTime: number;
}

export class AssignmentCreatorService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private useOpenAI: boolean = true;

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

  async createAssignment(request: AssignmentRequest): Promise<AssignmentResponse> {
    try {
      // Validate input
      this.validateAssignmentRequest(request);

      // Prepare prompt
      const prompt = this.buildAssignmentPrompt(request);

      // Try OpenAI first, fallback to Anthropic
      let response: AssignmentResponse;
      
      try {
        response = await this.generateWithOpenAI(prompt);
      } catch (error) {
        console.warn('OpenAI failed, trying Anthropic:', error);
        this.useOpenAI = false;
        response = await this.generateWithAnthropic(prompt);
      }

      // Validate and clean response
      return this.validateAndCleanResponse(response);

    } catch (error) {
      console.error('Assignment creation failed:', error);
      throw this.handleError(error);
    }
  }

  private validateAssignmentRequest(request: AssignmentRequest): void {
    if (!request.subject || !request.topic || !request.learningObjectives) {
      throw new Error(ERROR_MESSAGES.INVALID_INPUT);
    }

    if (request.learningObjectives.length === 0) {
      throw new Error('At least one learning objective is required');
    }

    if (request.duration < 15 || request.duration > 240) {
      throw new Error('Duration must be between 15 and 240 minutes');
    }

    const validTypes = ['essay', 'project', 'presentation', 'research', 'discussion', 'quiz'];
    if (!validTypes.includes(request.type)) {
      throw new Error(`Invalid assignment type. Must be one of: ${validTypes.join(', ')}`);
    }

    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(request.difficulty)) {
      throw new Error(`Invalid difficulty level. Must be one of: ${validDifficulties.join(', ')}`);
    }
  }

  private buildAssignmentPrompt(request: AssignmentRequest): string {
    return ASSIGNMENT_PROMPTS.assignment
      .replace('{subject}', request.subject)
      .replace('{topic}', request.topic)
      .replace('{learningObjectives}', request.learningObjectives.join(', '))
      .replace('{difficulty}', request.difficulty)
      .replace('{type}', request.type)
      .replace('{duration}', request.duration.toString())
      .replace('{requirements}', request.requirements || 'None specified');
  }

  private async generateWithOpenAI(prompt: string): Promise<AssignmentResponse> {
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

  private async generateWithAnthropic(prompt: string): Promise<AssignmentResponse> {
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

  private parseJSONResponse(content: string): AssignmentResponse {
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.title || !parsed.description || !parsed.instructions) {
        throw new Error('Missing required fields in response');
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response');
    }
  }

  private validateAndCleanResponse(response: AssignmentResponse): AssignmentResponse {
    // Ensure all required fields exist
    const cleaned: AssignmentResponse = {
      title: response.title || 'Untitled Assignment',
      description: response.description || 'No description provided',
      instructions: response.instructions || 'No instructions provided',
      rubric: response.rubric || {
        criteria: [
          {
            name: 'Content Quality',
            excellent: 'Exceptional understanding and application',
            good: 'Good understanding with minor gaps',
            satisfactory: 'Basic understanding demonstrated',
            needsImprovement: 'Limited understanding shown',
            points: 25
          }
        ],
        totalPoints: 25
      },
      resources: Array.isArray(response.resources) ? response.resources : [],
      learningOutcomes: Array.isArray(response.learningOutcomes) ? response.learningOutcomes : [],
      tips: Array.isArray(response.tips) ? response.tips : [],
      extensions: Array.isArray(response.extensions) ? response.extensions : [],
      estimatedTime: typeof response.estimatedTime === 'number' ? response.estimatedTime : 60
    };

    // Ensure rubric has proper structure
    if (!cleaned.rubric.criteria || !Array.isArray(cleaned.rubric.criteria)) {
      cleaned.rubric.criteria = [
        {
          name: 'Content Quality',
          excellent: 'Exceptional understanding and application',
          good: 'Good understanding with minor gaps',
          satisfactory: 'Basic understanding demonstrated',
          needsImprovement: 'Limited understanding shown',
          points: 25
        }
      ];
    }

    // Calculate total points if not provided
    if (!cleaned.rubric.totalPoints) {
      cleaned.rubric.totalPoints = cleaned.rubric.criteria.reduce((sum, criterion) => {
        return sum + (criterion.points || 0);
      }, 0);
    }

    return cleaned;
  }

  private handleError(error: any): Error {
    if (error.message?.includes('API key')) {
      return new Error(ERROR_MESSAGES.API_KEY_MISSING);
    }
    
    if (error.message?.includes('rate limit')) {
      return new Error(ERROR_MESSAGES.RATE_LIMIT);
    }
    
    if (error.message?.includes('context length')) {
      return new Error(ERROR_MESSAGES.CONTENT_TOO_LONG);
    }
    
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
} 