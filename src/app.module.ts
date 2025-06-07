import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { SolanaModule } from './solana/solana.module';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { AiModule } from './ai/ai.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { TransfersModule } from './transfers/transfers.module';

@Module({
  imports: [
    SolanaModule,
    WhatsappModule,
    UsersModule,
    ContactsModule,
    AiModule,
    ConfigModule,
    HttpModule,
    OrchestratorModule,
    TransfersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
