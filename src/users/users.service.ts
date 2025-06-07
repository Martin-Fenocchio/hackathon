import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(telephone: string, privatekey: string, publickey: string): Promise<User> {
        const user: User = {
            telephone,
            privatekey,
            publickey,
        };

        const { data, error } = await this.databaseService
            .getClient()
            .from('users')
            .insert([user])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }

        return data;
    }

    async findOne(telephone: string): Promise<User | null> {
        const { data, error } = await this.databaseService
            .getClient()
            .from('users')
            .select('*')
            .eq('telephone', telephone)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find user: ${error.message}`);
        }

        return data;
    }
}
