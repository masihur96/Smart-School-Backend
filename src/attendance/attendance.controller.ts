import { Controller, Get, Post, Query, Body, Req } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubmitPeriodAttendanceDto } from './dto/submit-period-attendance.dto';
import { PeriodAttendanceQueryDto } from './dto/period-attendance-query.dto';

@ApiTags('Teacher Attendance')
@ApiBearerAuth('bearer')
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) { }

  // ─────────────────────────────────────────────
  // Legacy daily attendance (kept for compatibility)
  // ─────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: '(Legacy) Submit daily attendance for a class' })
  async submitAttendance(@Body() data: any) {
    return await this.attendanceService.submitAttendance(data);
  }

  @Get()
  @ApiOperation({ summary: '(Legacy) Get daily attendance by classId & date' })
  async getAttendance(
    @Query('classId') classId: string,
    @Query('date') date?: string,
  ) {
    return await this.attendanceService.getAttendance(classId, date);
  }

  @Get('student')
  @ApiOperation({ summary: '(Legacy) Get all attendance records for a student' })
  async getStudentAttendance(@Query('studentId') studentId: string) {
    return await this.attendanceService.getStudentAttendance(studentId);
  }

  // ─────────────────────────────────────────────
  // Period / Routine-based attendance (Teacher)
  // ─────────────────────────────────────────────

  @Post('period')
  @ApiOperation({
    summary: 'Submit period-based attendance for an assigned routine',
    description:
      'Teacher can only submit attendance for routines assigned to them. ' +
      'The server resolves classId, sectionId, subjectId from the routine — ' +
      'only routineId + date + student records are required.',
  })
  async submitPeriodAttendance(
    @Req() req: any,
    @Body() dto: SubmitPeriodAttendanceDto,
  ) {
    const teacherId: string = req.user?.id ?? req.user?.sub;
    return await this.attendanceService.submitPeriodAttendance(teacherId, dto);
  }

  @Get('period')
  @ApiOperation({
    summary: 'Search & filter period-based attendance records',
    description:
      'Supports filters: studentName (ILIKE), studentId, classId, sectionId, ' +
      'subjectId, teacherId, routineId, date, startDate, endDate, status. Paginated.',
  })
  async getPeriodAttendance(@Query() query: PeriodAttendanceQueryDto) {
    return await this.attendanceService.getPeriodAttendance(query);
  }

  @Get('period/daily')
  @ApiOperation({
    summary: 'Get period-by-period attendance report for a specific date',
    description:
      'Returns each routine that had attendance taken that day, with all student records grouped under it.',
  })
  async getDailyReport(
    @Query('date') date: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return await this.attendanceService.getDailyAttendanceReport(
      date,
      classId,
      sectionId,
    );
  }
}
