import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Teacher')
@ApiBearerAuth('bearer')
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post()
  async submitAttendance(@Body() data: any) {
    return await this.attendanceService.submitAttendance(data);
  }

  @Get()
  async getAttendance(@Query('classId') classId: string, @Query('date') date?: string) {
    return await this.attendanceService.getAttendance(classId, date);
  }

  @Get(':studentId')
  async getStudentAttendance(@Query('studentId') studentId: string) {
    return await this.attendanceService.getStudentAttendance(studentId);
  }
}
