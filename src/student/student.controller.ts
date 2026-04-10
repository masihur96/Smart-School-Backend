import { Controller, Get, Post, Body, Request, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Public } from '../auth/decorators/public.decorator';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Student')
@ApiBearerAuth('bearer')
@Roles(UserRole.STUDENT, UserRole.SUPER_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('student')
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Register a new student' })
  @ApiResponse({
    status: 201,
    description: 'The student has been successfully created.',
  })
  async create(@Body() dto: CreateStudentDto) {
    return await this.studentService.create(dto);
  }

  @Get('results')
  async getResults(@Request() req: any) {
    return await this.studentService.getResults(req.user.userId);
  }

  @Get('attendance')
  async getAttendance(@Request() req: any) {
    return await this.studentService.getAttendance(req.user.userId);
  }

  @Get('routine')
  async getRoutine(@Query('classId') classId: string) {
    return await this.studentService.getRoutine(classId);
  }

  @Get('homework')
  async getHomework(@Request() req: any) {
    return await this.studentService.getHomework(req.user.userId);
  }

  @Get('performance-report')
  async getPerformanceReport(@Request() req: any) {
    return await this.studentService.getPerformanceReport(req.user.userId);
  }
}
