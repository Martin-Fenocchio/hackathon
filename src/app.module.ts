import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [AiModule, WhatsappModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
