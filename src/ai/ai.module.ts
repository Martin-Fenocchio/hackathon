import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { OpenAIProvider } from './provider/openai.provider';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [HttpModule],
  providers: [AiService, OpenAIProvider, ConfigService],
  exports: [AiService],
})
export class AiModule {}
