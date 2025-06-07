import { Injectable } from '@nestjs/common';
import { Contact } from './entities/contact.entity';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ContactsService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(user_telephone: string, name: string, publickey: string): Promise<Contact> {
        const contact: Contact = {
            user_telephone,
            name,
            publickey,
        };

        const { data, error } = await this.databaseService
            .getClient()
            .from('contacts')
            .insert([contact])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create contact: ${error.message}`);
        }

        return data;
    }

    async findAllByUser(user_telephone: string): Promise<Contact[]> {
        const { data, error } = await this.databaseService
            .getClient()
            .from('contacts')
            .select('*')
            .eq('user_telephone', user_telephone);

        if (error) {
            throw new Error(`Failed to find contacts: ${error.message}`);
        }

        return data || [];
    }
}
