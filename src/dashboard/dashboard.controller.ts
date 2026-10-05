import {
  Controller,
  Get,
  UseGuards,
  Request,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Dashboard')
@ApiBearerAuth('bearer')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Super Admin Dashboard
   * GET /dashboard/super-admin
   * Role: superadmin
   */
  @Get('super-admin')
  @Roles(UserRole.SUPER_ADMIN)
  async getSuperAdminDashboard() {
    return this.dashboardService.getSuperAdminDashboard();
  }

  /**
   * Admin Dashboard
   * GET /dashboard/admin
   * Role: admin
   * Requires schoolId on the JWT user object
   * Optional query params: month (1-12), year (e.g. 2026) for student attendance monthly summary & daily chart
   */
  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get Admin Dashboard data',
    description:
      'Returns teacher attendance, today student attendance, monthly student attendance summary with daily attendance chart data, recent homework, notices, exams, and upcoming meetings.',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description:
      'Month (1-12) for student attendance summary & daily chart (defaults to current month)',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description:
      'Year for student attendance summary & daily chart (defaults to current year)',
  })
  async getAdminDashboard(
    @Request() req: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const { schoolId } = req.user;
    if (!schoolId) {
      throw new ForbiddenException('Admin must be associated with a school');
    }
    const parsedMonth = month ? parseInt(month, 10) : undefined;
    const parsedYear = year ? parseInt(year, 10) : undefined;
    return this.dashboardService.getAdminDashboard(
      schoolId,
      parsedMonth,
      parsedYear,
    );
  }

  /**
   * Teacher Dashboard
   * GET /dashboard/teacher
   * Role: teacher
   * Requires id and schoolId on the JWT user object
   */
  @Get('teacher')
  @Roles(UserRole.TEACHER)
  async getTeacherDashboard(@Request() req: any) {
    const { id: teacherId, schoolId } = req.user;
    if (!schoolId) {
      throw new ForbiddenException('Teacher must be associated with a school');
    }
    return this.dashboardService.getTeacherDashboard(teacherId, schoolId);
  }

  /**
   * Student Dashboard
   * GET /dashboard/student
   * Role: student
   * Requires id and schoolId on the JWT user object
   */
  @Get('student')
  @Roles(UserRole.STUDENT)
  async getStudentDashboard(@Request() req: any) {
    const { id: studentId, schoolId } = req.user;
    if (!schoolId) {
      throw new ForbiddenException('Student must be associated with a school');
    }
    return this.dashboardService.getStudentDashboard(studentId, schoolId);
  }
}
