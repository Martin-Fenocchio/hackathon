import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { OrchestratorController } from './orchestrator.controller';
import { SolverModule } from '../solver/solver.module';
import { ContactsModule } from '../contacts/contacts.module';
import { AiModule } from '../ai/ai.module';
import { TransfersModule } from 'src/transfers/transfers.module';

@Module({
    imports: [SolverModule, ContactsModule, AiModule, TransfersModule],
    controllers: [OrchestratorController],
    providers: [OrchestratorService],
    exports: [OrchestratorService],
})
export class OrchestratorModule {} 