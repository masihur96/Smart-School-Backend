import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';

@ApiTags('Admin Teacher Attendance')
@ApiBearerAuth('bearer')
@Controller('admin/teacher-attendance')
export class AdminTeacherAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @ApiOperation({
    summary: 'Get teacher attendance records for all or specific teacher',
  })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiQuery({ name: 'date', required: false })
  async getTeacherAttendance(
    @Query('teacherId') teacherId?: string,
    @Query('schoolId') schoolId?: string,
    @Query('date') date?: string,
  ) {
    return await this.attendanceService.getTeacherAttendance(
      schoolId,
      teacherId,
      date,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a teacher attendance record' })
  async deleteTeacherAttendance(@Param('id') id: string) {
    return await this.attendanceService.deleteTeacherAttendance(id);
  }
}
