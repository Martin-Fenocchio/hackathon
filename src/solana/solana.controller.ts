import { Controller, Post, Body } from '@nestjs/common';
import { SolanaService } from './solana.service';

@Controller('solana')
export class SolanaController {
  constructor(private readonly solanaService: SolanaService) {}

  @Post('wallet')
  createWallet() {
    return this.solanaService.createWallet();
  }

  @Post('transfer')
  transferSol(
    @Body()
    transferDto: {
      fromSecretKey: string;
      toPublicKey: string;
      amount: number;
    },
  ) {
    return this.solanaService.transferToken(transferDto);
  }
}
