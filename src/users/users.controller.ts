import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Public } from '../auth/decorators/public.decorator';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new user (Registration)' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll(
    @Query('role') role?: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.usersService.findAll(role, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete user' })
  async remove(@Param('id') id: string) {
    return await this.usersService.delete(id);
  }

  @Get('trash')
  @ApiOperation({ summary: 'Get all soft-deleted users' })
  async findDeleted(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.usersService.findAllDeleted(page, limit);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  async restore(@Param('id') id: string) {
    try {
      return await this.usersService.restore(id);
    } catch {
      throw new NotFoundException(`User ${id} not found or not deleted`);
    }
  }
}
