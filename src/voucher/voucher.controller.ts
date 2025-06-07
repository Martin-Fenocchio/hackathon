import { Controller, Post, Body, Res } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { Transfer } from '../transfers/entities/transfer.entity';
import { Response } from 'express';

@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post('generate')
  async generateVoucher(@Body() transfer: Transfer, @Res() res: Response): Promise<void> {
    const voucherImage = await this.voucherService.generateVoucherImage({
      amount: transfer.amount,
      transferid: transfer.transferid!,
      destination_publickey: transfer.destination_publickey,
    });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="transfer-voucher-${transfer.transferid}.png"`,
    });

    res.send(voucherImage);
  }
}
