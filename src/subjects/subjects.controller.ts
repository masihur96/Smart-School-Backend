import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/create-subject.dto';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Controller('admin/subjects')
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subjects' })
  async findAll() {
    return await this.subjectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subject by ID' })
  async findOne(@Param('id') id: string) {
    return await this.subjectsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subject' })
  async create(@Body() data: CreateSubjectDto) {
    return await this.subjectsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update subject' })
  async update(@Param('id') id: string, @Body() data: UpdateSubjectDto) {
    return await this.subjectsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete subject' })
  async delete(@Param('id') id: string) {
    return await this.subjectsService.delete(id);
  }
}
