import { Module } from '@nestjs/common';
import { SolverService } from './solver.service';
import { SolverController } from './solver.controller';
import { AiModule } from '../ai/ai.module';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
    imports: [AiModule, ContactsModule],
    controllers: [SolverController],
    providers: [SolverService],
    exports: [SolverService],
})
export class SolverModule {} 