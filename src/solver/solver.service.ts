import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { ContactsService } from '../contacts/contacts.service';
import { SolveTextDto } from './dto/solve-text.dto';
import { SolverResult } from './interfaces/solver-result.interface';
import { AIRole } from '../ai/enum/roles.enum';
import { OpenAIModel } from 'src/ai/enum/models.enum';

@Injectable()
export class SolverService {
    constructor(
        private readonly aiService: AiService,
    ) {}

    async solveText(solveTextDto: SolveTextDto): Promise<SolverResult> {
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
        const parsedResult = JSON.parse(result) as SolverResult;

		return parsedResult;
		/*
        // If the recipient is a contact name, convert it to the corresponding public key
        if (parsedResult.recipient.type === 'contactName') {
            const contact = contacts.find(c => c.name.toLowerCase() === parsedResult.recipient.value.toLowerCase());
            if (contact) {
                parsedResult.recipient = {
                    type: 'publicKey',
                    value: contact.publickey,
                };
            }
        }

        return parsedResult;*/
    }
} 