import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto/create-class.dto';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Controller('admin/classes')
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all classes' })
  async findAll() {
    return await this.classesService.findAll();
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
  @ApiOperation({ summary: 'Delete class' })
  async delete(@Param('id') id: string) {
    return await this.classesService.delete(id);
  }
}
