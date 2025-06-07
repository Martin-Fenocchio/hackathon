import { Controller, Post, Body, Res } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { OrchestrateTransferTextDto } from './dto/orchestrate-text.dto';
import { OrchestratorResult } from './interfaces/orchestrator-result.interface';
import { Transfer } from 'src/transfers/entities/transfer.entity';
import { Response } from 'express';

@Controller('orchestrator')
export class OrchestratorController {
    constructor(private readonly orchestratorService: OrchestratorService) {}

    @Post('orchestrate')
    async orchestrateTransferText(@Body() orchestrateTransferTextDto: OrchestrateTransferTextDto): Promise<OrchestratorResult> {
        return this.orchestratorService.orchestrateTransferText(orchestrateTransferTextDto);
    }

    @Post('orchestrate_confirm_transfer')
    async orchestrateConfirmTransfer(
        @Body() body: { telephone: string },
        @Res() res: Response,
    ): Promise<void> {
        const { transfer, voucherImage } = await this.orchestratorService.orchestrateConfirmTransfer(body.telephone);
        
        res.set({
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment; filename="transfer-voucher-${transfer.transferid}.png"`,
        });
        
        res.send(voucherImage);
    }
} 