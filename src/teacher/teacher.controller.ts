import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { SubmitAttendanceDto } from '../attendance/dto/submit-attendance.dto';
import { SubmitMarksDto } from '../marks/dto/submit-marks.dto';
import { CreateHomeworkDto, UpdateHomeworkDto } from '../homework/dto/create-homework.dto';

@Controller('teacher')
@UseGuards(JwtAuthGuard)
export class TeacherController {
  constructor(private teacherService: TeacherService) {}

  // ─── Attendance ───────────────────────────────────
  @Post('attendance')
  @HttpCode(HttpStatus.CREATED)
  async submitAttendance(@Body() dto: SubmitAttendanceDto) {
    return await this.teacherService.submitAttendance(dto);
  }

  @Get('attendance')
  async getAttendance(
    @Query('classId') classId: string,
    @Query('date') date?: string,
  ) {
    return await this.teacherService.getAttendance(classId, date);
  }

  // ─── Marks ───────────────────────────────────────
  @Post('marks')
  @HttpCode(HttpStatus.CREATED)
  async submitMarks(@Body() dto: SubmitMarksDto) {
    return await this.teacherService.submitMarks(dto);
  }

  @Get('marks')
  async getMarks(
    @Query('examId') examId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return await this.teacherService.getMarks(examId, studentId);
  }

  // ─── Homework ─────────────────────────────────────
  @Post('homework')
  @HttpCode(HttpStatus.CREATED)
  async createHomework(@Body() dto: CreateHomeworkDto) {
    return await this.teacherService.createHomework(dto);
  }

  @Get('homework')
  async getHomework(
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return await this.teacherService.getHomework(classId, subjectId);
  }

  @Put('homework/:id')
  async updateHomework(
    @Param('id') id: string,
    @Body() dto: UpdateHomeworkDto,
  ) {
    return await this.teacherService.updateHomework(id, dto);
  }

  @Delete('homework/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHomework(@Param('id') id: string) {
    return await this.teacherService.deleteHomework(id);
  }

  // ─── Exams ───────────────────────────────────────
  @Get('exams')
  async getExams() {
    return await this.teacherService.getExams();
  }
}
