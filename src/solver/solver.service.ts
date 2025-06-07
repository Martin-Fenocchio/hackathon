/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { SolveTextDto } from './dto/solve-text.dto';
import { RecipientSolverResult, TextSolverResult } from './interfaces/solver-result.interface';
import { AIRole } from '../ai/enum/roles.enum';
import { OpenAIModel } from 'src/ai/enum/models.enum';

@Injectable()
export class SolverService {
  constructor(private readonly aiService: AiService) {}

  async solveText(solveTextDto: SolveTextDto): Promise<TextSolverResult> {
    // Create a prompt for the AI to analyze the text
    const prompt = `Analyze the following text and extract the recipient (either a contact name or a Solana public key) and the amount to transfer. 
        The amount should be a number.
        Return the result in this exact JSON format:
        {
            "recipient": {
                "type": "publicKey" or "contactName",
                "value": "the actual value"
            },
            "amount": number,
            "confidence": number between 0 and 1
        }

        Text to analyze: ${solveTextDto.text}`;

    const result = await this.aiService.chat({
      messages: [
        {
          role: AIRole.USER,
          content: prompt,
        },
      ],
      model: OpenAIModel.GPT4O_MINI,
      temperature: 0.1,
    });

    // Parse the AI response
    const parsedResult = JSON.parse(result) as TextSolverResult;

    return parsedResult;
  }

  async solveRecipient(recipient: string, contactsList: string): Promise<RecipientSolverResult> {
    const prompt = `Given the following contact name: "${recipient}"
		And this list of contacts: ${contactsList}
		
		Determine which contact is most likely the intended recipient.
		Return the result in this exact JSON format:
		{
			"publicKey": "the matching public key",
			"confidence": number between 0 and 1
		}.
		Only return the JSON, nothing else.`;

    const result = await this.aiService.chat({
      messages: [
        {
          role: AIRole.USER,
          content: prompt,
        },
      ],
      model: OpenAIModel.GPT4O_MINI,
      temperature: 0.1,
    });

    const parsedResult = JSON.parse(result) as RecipientSolverResult;
    return parsedResult;
  }
}
