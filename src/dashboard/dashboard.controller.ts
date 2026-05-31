import {
  Controller,
  Get,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  async getSuperAdminDashboard(@Request() req: any) {
    const { id: superAdminId } = req.user;
    return this.dashboardService.getSuperAdminDashboard(superAdminId);
  }

  /**
   * Admin Dashboard
   * GET /dashboard/admin
   * Role: admin
   * Requires schoolId on the JWT user object
   */
  @Get('admin')
  @Roles(UserRole.ADMIN)
  async getAdminDashboard(@Request() req: any) {
    const { schoolId } = req.user;
    if (!schoolId) {
      throw new ForbiddenException('Admin must be associated with a school');
    }
    return this.dashboardService.getAdminDashboard(schoolId);
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
