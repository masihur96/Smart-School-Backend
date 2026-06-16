import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto/create-class.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

interface JwtUser {
  id: string;
  role: string;
  schoolId: string | null;
}

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/classes')
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all classes for the logged-in school' })
  async findAll(@CurrentUser() user: JwtUser) {
    return await this.classesService.findAll(user.schoolId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class by ID' })
  async findOne(@Param('id') id: string) {
    return await this.classesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new class' })
  async create(@Body() data: CreateClassDto) {
    return await this.classesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update class' })
  async update(@Param('id') id: string, @Body() data: UpdateClassDto) {
    return await this.classesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete class' })
  async delete(@Param('id') id: string) {
    return await this.classesService.delete(id);
  }

  @Get('trash')
  @ApiOperation({ summary: 'Get all soft-deleted classes' })
  async findDeleted() {
    return await this.classesService.findAllDeleted();
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted class' })
  async restore(@Param('id') id: string) {
    try {
      return await this.classesService.restore(id);
    } catch {
      throw new NotFoundException(`Class ${id} not found or not deleted`);
    }
  }
}
