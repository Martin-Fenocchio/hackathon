import { AIMessage } from './message.dto';
import { AIProvider } from '../enum/roles.enum';
import { OpenAIModel } from '../enum/models.enum';
import { z } from 'zod';
export interface OpenAIOptionsDto {
  messages: AIMessage[];
  provider?: AIProvider;
  model: OpenAIModel;
  temperature?: number;
  maxTokens?: number;
  jsonOutput?: boolean;
  imageUrl?: string;
  schema?: z.ZodSchema;
}
