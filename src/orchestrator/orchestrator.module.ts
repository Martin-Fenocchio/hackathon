import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { OrchestratorController } from './orchestrator.controller';
import { SolverModule } from '../solver/solver.module';
import { ContactsModule } from '../contacts/contacts.module';
import { AiModule } from '../ai/ai.module';
import { TransfersModule } from 'src/transfers/transfers.module';
import { VoucherModule } from '../voucher/voucher.module';
import { UsersModule } from 'src/users/users.module';
import { SolanaModule } from 'src/solana/solana.module';

@Module({
  imports: [SolverModule, ContactsModule, AiModule, TransfersModule, VoucherModule, UsersModule, SolanaModule],
  controllers: [OrchestratorController],
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
