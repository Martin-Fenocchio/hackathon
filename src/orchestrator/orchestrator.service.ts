import { Injectable } from '@nestjs/common';
import { SolverService } from '../solver/solver.service';
import { ContactsService } from '../contacts/contacts.service';
import { OrchestrateTransferTextDto } from './dto/orchestrate-text.dto';
import { OrchestratorResult } from './interfaces/orchestrator-result.interface';
import { AiService } from '../ai/ai.service';
import { AIRole } from '../ai/enum/roles.enum';
import { OpenAIModel } from '../ai/enum/models.enum';

@Injectable()
export class OrchestratorService {
    constructor(
        private readonly solverService: SolverService,
        private readonly contactsService: ContactsService,
        private readonly aiService: AiService,
    ) {}

    async orchestrateTransferText(orchestrateTransferTextDto: OrchestrateTransferTextDto): Promise<OrchestratorResult> {
        // First, get the initial solver result
		console.log(orchestrateTransferTextDto);
        const solverResult = await this.solverService.solveText(orchestrateTransferTextDto);

        // If the recipient is already a public key, return the result as is
        if (solverResult.recipient.type === 'publicKey') {
            return solverResult;
        }


		return solverResult;

/*        // If it's a contact name, we need to resolve it
        const contacts = await this.contactsService.findAllByUser(orchestrateTransferTextDto.userTelephone);
        const contactsList = contacts.map(c => `${c.name}:${c.publickey}`).join(', ');

        // Create a prompt to help the AI identify the correct contact
        const prompt = `Given the following contact name: "${solverResult.recipient.value}"
        And this list of contacts: ${contactsList}
        
        Determine which contact is most likely the intended recipient.
        Return the result in this exact JSON format:
        {
            "publicKey": "the matching public key",
            "confidence": number between 0 and 1
        }`;

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
        const destination = JSON.parse(result.content);

        // Return the complete result
        return {
            ...solverResult,
            destination,
        };*/
    }
} 