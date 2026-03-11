import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('admin/subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @Get()
  async findAll() {
    return await this.subjectsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.subjectsService.findById(id);
  }

  @Post()
  async create(@Body() data: any) {
    return await this.subjectsService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return await this.subjectsService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.subjectsService.delete(id);
  }
}
