import { Controller, Get, Query, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Performance')
@ApiBearerAuth()
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('student')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get student performance (all if no studentId provided by Admin/Teacher)' })
  async getStudentPerformance(
    @Req() req: any,
    @Query('studentId') studentIdQuery?: string,
  ) {
    const currentUser = req.user;

    if (currentUser.role === UserRole.STUDENT) {
      if (studentIdQuery && studentIdQuery !== currentUser.id) {
        throw new UnauthorizedException('You can only view your own performance.');
      }
      return this.performanceService.getStudentPerformance(
        currentUser.id,
        currentUser.schoolId,
      );
    } else {
      if (!studentIdQuery) {
        // Admin or Teacher requesting all students
        return this.performanceService.getAllStudentsPerformance(currentUser.schoolId);
      }
      return this.performanceService.getStudentPerformance(
        studentIdQuery,
        currentUser.schoolId,
      );
    }
  }

  @Get('teacher')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get teacher performance (all if no teacherId provided by Admin)' })
  async getTeacherPerformance(
    @Req() req: any,
    @Query('teacherId') teacherIdQuery?: string,
  ) {
    const currentUser = req.user;

    if (currentUser.role === UserRole.TEACHER) {
      if (teacherIdQuery && teacherIdQuery !== currentUser.id) {
        throw new UnauthorizedException('You can only view your own performance.');
      }
      return this.performanceService.getTeacherPerformance(
        currentUser.id,
        currentUser.schoolId,
      );
    } else {
      if (!teacherIdQuery) {
        // Admin requesting all teachers
        return this.performanceService.getAllTeachersPerformance(currentUser.schoolId);
      }
      return this.performanceService.getTeacherPerformance(
        teacherIdQuery,
        currentUser.schoolId,
      );
    }
  }
}
