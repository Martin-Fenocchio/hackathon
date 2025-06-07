import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { SolanaModule } from './solana/solana.module';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';

@Module({
  imports: [SolanaModule, UsersModule, ContactsModule, AiModule, WhatsappModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
