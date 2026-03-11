import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('homework')
@UseGuards(JwtAuthGuard)
export class HomeworkController {
  constructor(private homeworkService: HomeworkService) {}

  @Post()
  async create(@Body() data: any) {
    return await this.homeworkService.create(data);
  }

  @Get()
  async findAll(@Query('classId') classId?: string, @Query('subjectId') subjectId?: string) {
    return await this.homeworkService.findAll(classId, subjectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.homeworkService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return await this.homeworkService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.homeworkService.delete(id);
  }
}
