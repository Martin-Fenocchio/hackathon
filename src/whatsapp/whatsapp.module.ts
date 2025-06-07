import { Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { OpenAIProvider } from '../ai/provider/openai.provider';
import { WhatsAppService } from '../whatsapp/service/whatsapp.service';
import { WhatsappApiService } from '../whatsapp/service/whatsapp.api.service';
import { WhatsAppController } from './whatsapp.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [WhatsAppController],
  providers: [WhatsappApiService, WhatsAppService, AiService, OpenAIProvider],
  exports: [WhatsappApiService, WhatsAppService],
})
export class WhatsappModule {}
