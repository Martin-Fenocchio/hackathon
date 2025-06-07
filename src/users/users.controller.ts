import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto.telephone, createUserDto.privatekey, createUserDto.publickey);
  }

  @Get(':telephone')
  async findOne(@Param('telephone') telephone: string): Promise<User | null> {
    return this.usersService.findOne(telephone);
  }
}
