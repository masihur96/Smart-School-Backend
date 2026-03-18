import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { MarksService } from './marks.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Teacher')
@ApiBearerAuth('bearer')
@Controller('marks')
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
