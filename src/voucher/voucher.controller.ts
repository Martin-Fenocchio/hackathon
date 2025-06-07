import { Controller, Post, Body, Res } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { Transfer } from '../transfers/entities/transfer.entity';
import { Response } from 'express';

@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post('generate')
  async generateVoucher(@Body() transfer: Transfer, @Res() res: Response): Promise<void> {
    const voucherImage = await this.voucherService.generateVoucherImage(transfer);

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="transfer-voucher-${transfer.transferid}.png"`,
    });

    res.send(voucherImage);
  }
}
