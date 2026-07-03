import { Controller, Get, Query, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('student')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getStudentPerformance(
    @Req() req: any,
    @Query('studentId') studentIdQuery?: string,
  ) {
    const currentUser = req.user;
    let studentIdToFetch = studentIdQuery;

    if (currentUser.role === UserRole.STUDENT) {
      if (studentIdQuery && studentIdQuery !== currentUser.id) {
        throw new UnauthorizedException('You can only view your own performance.');
      }
      studentIdToFetch = currentUser.id;
    } else {
      if (!studentIdToFetch) {
        throw new UnauthorizedException('Please provide a studentId.');
      }
    }

    return this.performanceService.getStudentPerformance(
      studentIdToFetch,
      currentUser.schoolId,
    );
  }

  @Get('teacher')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getTeacherPerformance(
    @Req() req: any,
    @Query('teacherId') teacherIdQuery?: string,
  ) {
    const currentUser = req.user;
    let teacherIdToFetch = teacherIdQuery;

    if (currentUser.role === UserRole.TEACHER) {
      if (teacherIdQuery && teacherIdQuery !== currentUser.id) {
        throw new UnauthorizedException('You can only view your own performance.');
      }
      teacherIdToFetch = currentUser.id;
    } else {
      if (!teacherIdToFetch) {
        throw new UnauthorizedException('Please provide a teacherId.');
      }
    }

    return this.performanceService.getTeacherPerformance(
      teacherIdToFetch,
      currentUser.schoolId,
    );
  }
}
