import { Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { OpenAIProvider } from '../ai/provider/openai.provider';
import { WhatsAppService } from './service/whatsapp.service';
import { WhatsappApiService } from './service/whatsapp.api.service';
import { WhatsAppController } from './whatsapp.controller';
import { SolanaModule } from 'src/solana/solana.module';
import { OrchestratorModule } from 'src/orchestrator/orchestrator.module';
import { UsersModule } from 'src/users/users.module';
import { TransfersModule } from 'src/transfers/transfers.module';

@Module({
  imports: [HttpModule, ConfigModule, SolanaModule, OrchestratorModule, UsersModule, TransfersModule],
  controllers: [WhatsAppController],
  providers: [WhatsappApiService, WhatsAppService, AiService, OpenAIProvider],
  exports: [WhatsappApiService, WhatsAppService],
})
export class WhatsappModule {}
