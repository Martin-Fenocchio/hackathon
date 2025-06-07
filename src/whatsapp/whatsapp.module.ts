import { Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from '../whatsApp/whasapp.controller';
import { AiService } from '../ai/ai.service';
import { OpenAIProvider } from '../ai/provider/openai.provider';
import { WhatsAppService } from '../whatsApp/service/whatsapp.service';
import { WhatsappApiService } from '../whatsApp/service/whatsapp.api.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [WhatsAppController],
  providers: [WhatsappApiService, WhatsAppService, AiService, OpenAIProvider],
  exports: [WhatsappApiService, WhatsAppService],
})
export class WhatsappModule {}
