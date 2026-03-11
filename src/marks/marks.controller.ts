import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { MarksService } from './marks.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('marks')
@UseGuards(JwtAuthGuard)
export class MarksController {
  constructor(private marksService: MarksService) {}

  @Post()
  async submitMarks(@Body() data: any) {
    return await this.marksService.submitMarks(data);
  }

  @Get()
  async getMarks(@Query('examId') examId?: string, @Query('studentId') studentId?: string) {
    return await this.marksService.getMarks(examId, studentId);
  }
}
