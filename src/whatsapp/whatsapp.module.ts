import { Module } from '@nestjs/common';
import { WhatsappApiService } from './service/whatsapp.api.service';
import { WhatsAppService } from './service/whatsapp.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from './whasapp.controller';
import { AiService } from '../ai/ai.service';
import { OpenAIProvider } from '../ai/provider/openai.provider';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [WhatsAppController],
  providers: [WhatsappApiService, WhatsAppService, AiService, OpenAIProvider],
  exports: [WhatsappApiService, WhatsAppService],
})
export class WhatsappModule {}
