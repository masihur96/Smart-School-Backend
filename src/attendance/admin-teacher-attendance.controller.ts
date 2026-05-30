import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Admin Teacher Attendance')
@ApiBearerAuth('bearer')
@Controller('admin/teacher-attendance')
export class AdminTeacherAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) { }

  @Get()
  @ApiOperation({
    summary: 'Get teacher attendance records for all or specific teacher',
  })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getTeacherAttendance(
    @CurrentUser() user: any,
    @Query('teacherId') teacherId?: string,
    @Query('schoolId') querySchoolId?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const schoolId = user.role === UserRole.SUPER_ADMIN ? querySchoolId : user.schoolId;

    return await this.attendanceService.getTeacherAttendance(
      schoolId,
      teacherId,
      date,
      startDate,
      endDate,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a teacher attendance record' })
  async deleteTeacherAttendance(@Param('id') id: string) {
    return await this.attendanceService.deleteTeacherAttendance(id);
  }
}
