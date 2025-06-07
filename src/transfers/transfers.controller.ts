import { Controller, Post, Get, Put, Body, Param } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { Transfer } from './entities/transfer.entity';

@Controller('transfers')
export class TransfersController {
    constructor(private readonly transfersService: TransfersService) {}

    @Post()
    async create(@Body() createTransferDto: CreateTransferDto): Promise<Transfer> {
        return this.transfersService.create(
            createTransferDto.telephone,
            createTransferDto.amount,
            createTransferDto.destination_publickey,
            createTransferDto.transferid,
        );
    }

    @Get('user/:telephone')
    async findAllByUser(@Param('telephone') telephone: string): Promise<Transfer[]> {
        return this.transfersService.findAllByUser(telephone);
    }

    @Get(':transferid')
    async findOne(@Param('transferid') transferid: string): Promise<Transfer | null> {
        return this.transfersService.findOne(transferid);
    }

    @Put('confirm_last_pending_transfer')
    async confirmTransfer(): Promise<Transfer> {
        return this.transfersService.confirmTransfer();
    }
} 