import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import {
  AttendanceOverviewQueryDto,
  AttendanceOverviewResponseDto,
  MonthlyAttendanceOverviewQueryDto,
} from './dto/attendance-overview.dto';
import { SubmitPeriodAttendanceDto } from './dto/submit-period-attendance.dto';
import { PeriodAttendanceQueryDto } from './dto/period-attendance-query.dto';

@ApiTags('Admin Attendance')
@ApiBearerAuth('bearer')
@Controller('admin/attendance')
export class AdminAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) { }

  // ─────────────────────────────────────────────
  // Legacy overview endpoints (kept for compatibility)
  // ─────────────────────────────────────────────

  @Get('overview')
  @ApiOperation({ summary: '(Legacy) Get attendance overview for a specific month' })
  @ApiResponse({
    status: 200,
    description: 'Attendance overview retrieved successfully',
    type: AttendanceOverviewResponseDto,
  })
  async getOverview(@Query() query: AttendanceOverviewQueryDto) {
    return await this.attendanceService.getAttendanceOverview(query);
  }

  @Get('monthly-overview')
  @ApiOperation({
    summary: '(Legacy) Get monthly attendance overview for a specific year',
  })
  async getMonthlyOverview(@Query() query: MonthlyAttendanceOverviewQueryDto) {
    return await this.attendanceService.getMonthlyAttendanceOverview(query);
  }

  // ─────────────────────────────────────────────
  // Period / Routine-based attendance (Admin)
  // ─────────────────────────────────────────────

  @Post('period')
  @ApiOperation({
    summary: 'Admin: Submit period-based attendance for any routine',
    description:
      'Admin can submit attendance for any scheduled period. ' +
      'Only routineId + date + records are required; all other fields are resolved server-side.',
  })
  async adminSubmitPeriodAttendance(@Body() dto: SubmitPeriodAttendanceDto) {
    return await this.attendanceService.adminSubmitPeriodAttendance(dto);
  }

  @Get('period')
  @ApiOperation({
    summary: 'Admin: Search & filter period attendance records',
    description:
      'Full-access filter across all period attendance. ' +
      'Filters: studentName (ILIKE), studentId, classId, sectionId, ' +
      'subjectId, teacherId, routineId, date, startDate, endDate, status. Paginated.',
  })
  async getPeriodAttendance(@Query() query: PeriodAttendanceQueryDto) {
    return await this.attendanceService.getPeriodAttendance(query);
  }

  @Get('period/daily')
  @ApiOperation({
    summary: 'Admin: Period-by-period daily attendance report',
    description:
      'Returns each scheduled period that had attendance taken on the given date, ' +
      'with every student record nested under its period.',
  })
  @ApiQuery({ name: 'date', required: true, example: '2026-05-14' })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'sectionId', required: false })
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

  @Get('period/monthly')
  @ApiOperation({
    summary: 'Admin: Monthly subject-wise & class-wise attendance aggregation',
    description:
      'Returns two aggregations for the given month/year: ' +
      'bySubject (subject + present/absent/late/leave counts + %) ' +
      'and byClass (class-level totals).',
  })
  @ApiQuery({ name: 'month', required: true, example: 5 })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiQuery({ name: 'classId', required: false })
  @ApiQuery({ name: 'sectionId', required: false })
  async getMonthlyOverviewPeriod(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return await this.attendanceService.getMonthlyPeriodOverview(
      parseInt(month, 10),
      parseInt(year, 10),
      classId,
      sectionId,
    );
  }

  @Get('period/student/:studentId')
  @ApiOperation({
    summary: 'Admin: Individual student attendance analytics by subject',
    description:
      'Returns per-subject breakdown for the student: total classes, ' +
      'present/absent/late/leave counts, percentage. ' +
      'Optionally filter by month and year.',
  })
  @ApiQuery({ name: 'month', required: false, example: 5 })
  @ApiQuery({ name: 'year', required: false, example: 2026 })
  async getStudentAnalytics(
    @Param('studentId') studentId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return await this.attendanceService.getStudentAttendanceAnalytics(
      studentId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Delete('period/:id')
  @ApiOperation({ summary: 'Admin: Soft-delete a period attendance record' })
  async deletePeriodAttendance(@Param('id') id: string) {
    return await this.attendanceService.deletePeriodAttendance(id);
  }
}
