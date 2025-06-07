import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Contact } from './entities/contact.entity';

@Controller('contacts')
export class ContactsController {
    constructor(private readonly contactsService: ContactsService) {}

    @Post()
    async create(@Body() createContactDto: CreateContactDto): Promise<Contact> {
        return this.contactsService.create(
            createContactDto.user_telephone,
            createContactDto.name,
            createContactDto.publickey,
        );
    }

    @Get('user/:user_telephone')
    async findAllByUser(@Param('user_telephone') user_telephone: string): Promise<Contact[]> {
        return this.contactsService.findAllByUser(user_telephone);
    }
}
