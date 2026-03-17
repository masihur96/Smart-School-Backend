import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CreateStudentDto } from './dto/create-student.dto';
import { Public } from '../auth/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Student')
@Controller('student')
@UseGuards(JwtAuthGuard)
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Register a new student' })
  @ApiResponse({ status: 201, description: 'The student has been successfully created.' })
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
  async getHomework(@Query('classId') classId?: string) {
    return await this.studentService.getHomework(classId);
  }
}
