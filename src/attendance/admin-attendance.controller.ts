import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import {
  AttendanceOverviewQueryDto,
  AttendanceOverviewResponseDto,
  MonthlyAttendanceOverviewQueryDto,
} from './dto/attendance-overview.dto';

@ApiTags('Admin Attendance')
@ApiBearerAuth('bearer')
@Controller('admin/attendance')
export class AdminAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get attendance overview for a specific month' })
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
    summary: 'Get monthly attendance overview for a specific year',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly attendance overview retrieved successfully',
  })
  async getMonthlyOverview(@Query() query: MonthlyAttendanceOverviewQueryDto) {
    return await this.attendanceService.getMonthlyAttendanceOverview(query);
  }
}
