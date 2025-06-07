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

        🚨🚨🚨 ABSOLUTELY CRITICAL - READ THIS MULTIPLE TIMES 🚨🚨🚨
        
        IF THE RECIPIENT IS A WALLET ADDRESS/PUBLIC KEY:
        - DO NOT CHANGE ANY LETTERS TO LOWERCASE
        - DO NOT CHANGE ANY LETTERS TO UPPERCASE  
        - DO NOT MODIFY THE CASE IN ANY WAY
        - COPY THE EXACT CHARACTERS AS THEY APPEAR
        - WALLET ADDRESSES ARE CASE-SENSITIVE
        
        EXAMPLES OF WHAT YOU MUST DO:
        ✅ Input: "Send to ABC123def" → Output: "ABC123def" (EXACT COPY)
        ✅ Input: "Transfer to xyz456XYZ" → Output: "xyz456XYZ" (EXACT COPY)
        ✅ Input: "Pay GhJkL9876mNpQ" → Output: "GhJkL9876mNpQ" (EXACT COPY)
        
        EXAMPLES OF WHAT YOU MUST NOT DO:
        ❌ Input: "ABC123def" → Output: "abc123def" (WRONG - changed to lowercase)
        ❌ Input: "xyz456XYZ" → Output: "XYZ456XYZ" (WRONG - changed case)
        ❌ Input: "GhJkL9876" → Output: "ghjkl9876" (WRONG - changed to lowercase)
        
        REPEAT: PRESERVE EXACT CASE OF WALLET ADDRESSES - NO MODIFICATIONS ALLOWED!
        
        Only return the JSON, nothing else.
        `;

    console.log('prompt', prompt);

    const result = await this.aiService.chat({
      messages: [
        {
          role: AIRole.SYSTEM,
          content: prompt,
        },
        {
          role: AIRole.USER,
          content: `Text to analyze: ${solveTextDto.text}`,
        },
      ],
      model: OpenAIModel.GPT4_1,
      temperature: 0,
    });

    // Clean the AI response before parsing
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
