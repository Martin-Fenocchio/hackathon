import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SolanaModule } from './solana/solana.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [SolanaModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
