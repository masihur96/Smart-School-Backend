import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('student')
@UseGuards(JwtAuthGuard)
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Get('results')
  async getResults(@Request() req: any) {
    return await this.studentService.getResults(req.user.userId);
  }

  @Get('attendance')
  async getAttendance(@Request() req: any) {
    return await this.studentService.getAttendance(req.user.userId);
  }

  @Get('routine')
  async getRoutine(@Query('classId') classId: string) {
    return await this.studentService.getRoutine(classId);
  }

  @Get('homework')
  async getHomework(@Query('classId') classId?: string) {
    return await this.studentService.getHomework(classId);
  }
}
