import { Controller, Post, Body } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { OrchestrateTransferTextDto } from './dto/orchestrate-text.dto';
import { OrchestratorResult } from './interfaces/orchestrator-result.interface';

@Controller('orchestrator')
export class OrchestratorController {
    constructor(private readonly orchestratorService: OrchestratorService) {}

    @Post('orchestrate')
    async orchestrateTransferText(@Body() orchestrateTransferTextDto: OrchestrateTransferTextDto): Promise<OrchestratorResult> {
        return this.orchestratorService.orchestrateTransferText(orchestrateTransferTextDto);
    }
} 