import { Controller, Get, Query, Body, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { WhatsAppService } from './service/whatsapp.service';
import { SimpleIncomingMessagePayload } from './dto/whatsapp.message.dto';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Get('webhook')
  @HttpCode(HttpStatus.OK)
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): number {
    console.log('verifyWebhook', mode, token, challenge);
    return this.whatsAppService.verifyWebhook(mode, token, challenge);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhookPost(@Body() dataMessage: SimpleIncomingMessagePayload): Promise<{ status: number }> {
    await this.whatsAppService.handleWebhookPost(new SimpleIncomingMessagePayload(dataMessage));
    return { status: 200 };
  }
}
