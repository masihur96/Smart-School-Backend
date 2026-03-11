import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(
    @Query('role') role?: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.usersService.findAll(role, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.usersService.delete(id);
  }
}
