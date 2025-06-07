import { AIRole } from '../enum/roles.enum';

export interface AIMessage {
  role: AIRole;
  content: string | null;
}
