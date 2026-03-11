import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('admin/classes')
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get()
  async findAll() {
    return await this.classesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.classesService.findById(id);
  }

  @Post()
  async create(@Body() data: any) {
    return await this.classesService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return await this.classesService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.classesService.delete(id);
  }
}
