import { Injectable } from '@nestjs/common';
import { Transfer } from './entities/transfer.entity';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TransfersService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(telephone: string, amount: number, destination_publickey: string, transferid?: string): Promise<Transfer> {
        const transfer: Transfer = {
            telephone,
            amount,
            destination_publickey,
            ...(transferid && { transferid }),
        };

        const { data, error } = await this.databaseService
            .getClient()
            .from('transfers')
            .insert([transfer])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create transfer: ${error.message}`);
        }

        return data;
    }

    async findAllByUser(telephone: string): Promise<Transfer[]> {
        const { data, error } = await this.databaseService
            .getClient()
            .from('transfers')
            .select('*')
            .eq('telephone', telephone)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to find transfers: ${error.message}`);
        }

        return data || [];
    }

    async findOne(transferid: string): Promise<Transfer | null> {
        const { data, error } = await this.databaseService
            .getClient()
            .from('transfers')
            .select('*')
            .eq('transferid', transferid)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find transfer: ${error.message}`);
        }

        return data;
    }

    async updateTransferId(id: number, transferid: string): Promise<Transfer> {
        const { data, error } = await this.databaseService
            .getClient()
            .from('transfers')
            .update({ transferid })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update transfer: ${error.message}`);
        }

        if (!data) {
            throw new Error('Transfer not found');
        }

        return data;
    }
} 