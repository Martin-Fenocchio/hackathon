/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { Transfer } from './entities/transfer.entity';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TransfersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    telephone: string,
    amount: number,
    destination_publickey: string,
    transferid?: string,
  ): Promise<Transfer> {
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

  async confirmLastPendingTransfer(telephone: string): Promise<Transfer> {
    const { data: lastTransfer, error: findError } = await this.databaseService
      .getClient()
      .from('transfers')
      .select('*')
      .is('transferid', null)
      .eq('telephone', telephone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError) {
      throw new Error(`Failed to find last pending transfer: ${findError.message}`);
    }

    if (!lastTransfer) {
      throw new Error('No pending transfers found');
    }

    const { data, error } = await this.databaseService
      .getClient()
      .from('transfers')
      .update({ transferid: Math.random().toString(36).substring(2, 15) })
      .eq('id', lastTransfer.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update transfer: ${error.message}`);
    }

    return data;
  }
}
