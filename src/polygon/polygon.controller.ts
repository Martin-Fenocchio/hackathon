import { Body, Controller, Get, Post } from '@nestjs/common';
import { PolygonService } from './polygon.service';

@Controller('polygon')
export class PolygonController {
  constructor(private readonly polygonWalletService: PolygonService) {}

  @Get('create')
  createWallet() {
    return this.polygonWalletService.createWallet();
  }

  @Post('send')
  async sendMatic(@Body() body: { privateKey: string; to: string; amount: string }) {
    return this.polygonWalletService.sendMatic(body.privateKey, body.to, body.amount);
  }
}
