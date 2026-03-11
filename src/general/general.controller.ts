import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { GeneralService } from './general.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('general')
export class GeneralController {
  constructor(private generalService: GeneralService) {}

  // Notices - public endpoint for getting notices
  @Get('notices')
  async getNotices() {
    return await this.generalService.getAllNotices();
  }

  @Get('notices/:id')
  async getNoticeById(@Param('id') id: string) {
    return await this.generalService.getNoticeById(id);
  }

  @Post('notices')
  @UseGuards(JwtAuthGuard)
  async createNotice(@Body() data: any) {
    return await this.generalService.createNotice(data);
  }

  @Put('notices/:id')
  @UseGuards(JwtAuthGuard)
  async updateNotice(@Param('id') id: string, @Body() data: any) {
    return await this.generalService.updateNotice(id, data);
  }

  @Delete('notices/:id')
  @UseGuards(JwtAuthGuard)
  async deleteNotice(@Param('id') id: string) {
    return await this.generalService.deleteNotice(id);
  }

  // Routine endpoints
  @Get('routine/:classId')
  async getRoutineByClass(@Param('classId') classId: string) {
    return await this.generalService.getRoutineByClass(classId);
  }

  @Get('routine')
  async getAllRoutines() {
    return await this.generalService.getAllRoutines();
  }

  @Post('routine')
  @UseGuards(JwtAuthGuard)
  async createRoutine(@Body() data: any) {
    return await this.generalService.createRoutine(data);
  }

  @Put('routine/:id')
  @UseGuards(JwtAuthGuard)
  async updateRoutine(@Param('id') id: string, @Body() data: any) {
    return await this.generalService.updateRoutine(id, data);
  }

  @Delete('routine/:id')
  @UseGuards(JwtAuthGuard)
  async deleteRoutine(@Param('id') id: string) {
    return await this.generalService.deleteRoutine(id);
  }
}
