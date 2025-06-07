import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { SolverModule } from '../solver/solver.module';
import { ContactsModule } from '../contacts/contacts.module';
import { AiModule } from '../ai/ai.module';
import { TransfersModule } from 'src/transfers/transfers.module';
import { VoucherModule } from '../voucher/voucher.module';
import { SolanaModule } from 'src/solana/solana.module';

@Module({
  imports: [SolverModule, ContactsModule, AiModule, TransfersModule, VoucherModule, SolanaModule],
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
