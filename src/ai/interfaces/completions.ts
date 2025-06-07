import { AIMessage } from '../dto/message.dto';
import { OpenAIModel } from '../enum/models.enum';
import { AIRole } from '../enum/roles.enum';

export interface Completion {
  messages: AIMessage[];
  model: OpenAIModel;
  temperature?: number;
  maxTokens?: number;
  jsonOutput?: boolean;
}

export interface ConversationMessage {
  role: AIRole;
  content: string;
}
