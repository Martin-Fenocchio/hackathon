import { Injectable } from '@nestjs/common';
import { SolverService } from '../solver/solver.service';
import { ContactsService } from '../contacts/contacts.service';
import { OrchestrateTransferTextDto } from './dto/orchestrate-text.dto';
import { OrchestratorResult } from './interfaces/orchestrator-result.interface';
import { TransfersService } from 'src/transfers/transfers.service';
import { RecipientSolverResult } from 'src/solver/interfaces/solver-result.interface';

@Injectable()
export class OrchestratorService {
    constructor(
        private readonly solverService: SolverService,
        private readonly contactsService: ContactsService,
		private readonly transfersService: TransfersService,
    ) {}

    async orchestrateTransferText(orchestrateTransferTextDto: OrchestrateTransferTextDto): Promise<OrchestratorResult> {
        // First, get the initial solver result
        const solverResult = await this.solverService.solveText(orchestrateTransferTextDto);

        let destination: RecipientSolverResult;
        // If the recipient is already a public key, return the result as is
        if (solverResult.recipient.type !== 'publicKey') {
            // If it's a contact name, we need to resolve it
            const contacts = await this.contactsService.findAllByUser(orchestrateTransferTextDto.userTelephone);
            const contactsList = contacts.map(c => `${c.name}:${c.publickey}`).join(', ');

            destination = await this.solverService.solveRecipient(solverResult.recipient.value, contactsList);
        } else {
            destination = {
                publicKey: solverResult.recipient.value,
            };
        }

		const transfer = await this.transfersService.create(
			orchestrateTransferTextDto.userTelephone,
			solverResult.amount,
			destination.publicKey,
		);


		return {
			recipient: {
				type: 'publicKey',
				value: destination.publicKey,
			},
			amount: solverResult.amount,
		}
    }
} 