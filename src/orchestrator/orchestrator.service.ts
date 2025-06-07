/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { SolverService } from '../solver/solver.service';
import { ContactsService } from '../contacts/contacts.service';
import { OrchestrateTransferTextDto } from './dto/orchestrate-text.dto';
import { OrchestratorResult } from './interfaces/orchestrator-result.interface';
import { TransfersService } from 'src/transfers/transfers.service';
import { RecipientSolverResult } from 'src/solver/interfaces/solver-result.interface';
import { VoucherService } from '../voucher/voucher.service';
import { SolanaService } from 'src/solana/solana.service';
import { UsersService } from 'src/users/users.service';
import { Contact } from 'src/contacts/entities/contact.entity';
@Injectable()
export class OrchestratorService {
  constructor(
    private readonly solverService: SolverService,
    private readonly contactsService: ContactsService,
    private readonly transfersService: TransfersService,
    private readonly voucherService: VoucherService,
    private readonly solanaService: SolanaService,
    private readonly usersService: UsersService,
  ) {}

  async orchestrateTransferText(orchestrateTransferTextDto: OrchestrateTransferTextDto): Promise<OrchestratorResult> {
    // First, get the initial solver result
    const solverResult = await this.solverService.solveText(orchestrateTransferTextDto);

    let destination: RecipientSolverResult;
    // If the recipient is already a public key, return the result as is
    if (solverResult.recipient.type !== 'publicKey') {
      // If it's a contact name, we need to resolve it
      const contacts = await this.contactsService.findAllByUser(orchestrateTransferTextDto.userTelephone);
      const contactsList = contacts.map((c) => `${c.name}:${c.publickey}`).join(', ');

      destination = await this.solverService.solveRecipient(solverResult.recipient.value, contactsList);
    } else {
      const words = orchestrateTransferTextDto.text.split(' ');
      const longestWord = words.reduce((longest, current) => (current.length > longest.length ? current : longest));
      destination = {
        publicKey: longestWord,
      };
    }

    await this.transfersService.create(
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
    };
  }

  async orchestrateConfirmTransfer(payload: { telephone: string }): Promise<{ voucherImage: Buffer }> {
    const transfer = await this.transfersService.confirmLastPendingTransfer(payload.telephone);
    console.log('transfer', transfer);
    const user = await this.usersService.findOne(payload.telephone);
    console.log('user', user);
    const { transferenceID } = await this.solanaService.transferToken({
      fromSecretKey: '6+HHB29E0GeFqVHRgsVB7A7FxO5+ND2OYn/spkdMBBz5J7r+rzLbpQbsM2KZpD2coqQafnBXQ33iAUPdM5sNEQ==',
      toPublicKey: transfer.destination_publickey,
      amount: transfer.amount,
    });

    console.log('transferenceID', transferenceID);

    const voucherImage = await this.voucherService.generateVoucherImage({
      transferid: transferenceID,
      amount: transfer.amount,
      destination_publickey: transfer.destination_publickey,
    });

    return {
      voucherImage,
    };
  }

  async orchestrateCreateContact(payload: { telephone: string, name: string }): Promise<{ contact: Contact }> {    
    const transfer = await this.transfersService.findLastByUser(payload.telephone);
    const contact = await this.contactsService.create(payload.telephone, payload.name, transfer!.destination_publickey);

    return {
      contact,
    };
  }
}
