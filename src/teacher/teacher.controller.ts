import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('teacher')
@UseGuards(JwtAuthGuard)
export class TeacherController {
  constructor(private teacherService: TeacherService) {}

  // Attendance endpoints
  @Post('attendance')
  async submitAttendance(@Body() data: any) {
    return await this.teacherService.submitAttendance(data);
  }

  @Get('attendance')
  async getAttendance(@Query('classId') classId: string, @Query('date') date?: string) {
    return await this.teacherService.getAttendance(classId, date);
  }

  // Marks endpoints
  @Post('marks')
  async submitMarks(@Body() data: any) {
    return await this.teacherService.submitMarks(data);
  }

  @Get('marks')
  async getMarks(@Query('examId') examId?: string, @Query('studentId') studentId?: string) {
    return await this.teacherService.getMarks(examId, studentId);
  }

  // Homework endpoints
  @Post('homework')
  async createHomework(@Body() data: any) {
    return await this.teacherService.createHomework(data);
  }

  @Get('homework')
  async getHomework(@Query('classId') classId?: string, @Query('subjectId') subjectId?: string) {
    return await this.teacherService.getHomework(classId, subjectId);
  }

  @Put('homework/:id')
  async updateHomework(@Param('id') id: string, @Body() data: any) {
    return await this.teacherService.updateHomework(id, data);
  }

  @Delete('homework/:id')
  async deleteHomework(@Param('id') id: string) {
    return await this.teacherService.deleteHomework(id);
  }

  // Exams endpoints
  @Get('exams')
  async getExams() {
    return await this.teacherService.getExams();
  }
}
