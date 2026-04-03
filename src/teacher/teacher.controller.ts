import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { SubmitAttendanceDto } from '../attendance/dto/submit-attendance.dto';
import { SubmitMarksDto } from '../marks/dto/submit-marks.dto';
import {
  CreateHomeworkDto,
  UpdateHomeworkDto,
} from '../homework/dto/create-homework.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Teacher')
@ApiBearerAuth('bearer')
@Controller('teacher')
export class TeacherController {
  constructor(private teacherService: TeacherService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Register a new teacher' })
  @ApiResponse({
    status: 201,
    description: 'The teacher has been successfully created.',
  })
  async create(@Body() dto: CreateTeacherDto) {
    return await this.teacherService.create(dto);
  }

  // ─── Attendance ───────────────────────────────────
  @Post('attendance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit attendance for a class' })
  @ApiBody({
    type: SubmitAttendanceDto,
    examples: {
      sample: {
        summary: 'Sample attendance payload',
        value: {
          date: '2026-03-20',
          takenBy: 'uuid-teacher-001',
          classId: 'uuid-class-001',
          records: [
            { studentId: 'uuid-student-001', status: 'present' },
            { studentId: 'uuid-student-002', status: 'absent' },
            { studentId: 'uuid-student-003', status: 'leave' },
          ],
        },
      },
    },
  })
  async submitAttendance(@Body() dto: SubmitAttendanceDto) {
    return await this.teacherService.submitAttendance(dto);
  }

  @Get('attendance')
  async getAttendance(
    @Query('classId') classId: string,
    @Query('date') date?: string,
  ) {
    return await this.teacherService.getAttendance(classId, date);
  }

  // ─── Marks ───────────────────────────────────────
  @Get('assigned-subjects')
  async getAssignedSubjects(@Request() req) {
    return await this.teacherService.getAssignedSubjectsAndStudents(
      req.user.userId,
    );
  }

  @Post('marks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit marks for students in an assigned subject' })
  @ApiBody({
    type: SubmitMarksDto,
    examples: {
      sample: {
        summary: 'Sample marks payload',
        value: {
          examId: 'uuid-exam-001',
          teacherId: 'uuid-teacher-001',
          schoolId: 'uuid-school-001',
          marks: [
            {
              studentId: 'uuid-student-001',
              subjectId: 'uuid-subject-001',
              marksObtained: 85.5,
              totalMarks: 100,
              remarks: 'Good progress',
            },
            {
              studentId: 'uuid-student-002',
              subjectId: 'uuid-subject-001',
              marksObtained: 92.0,
              totalMarks: 100,
              remarks: 'Excellent',
            },
          ],
        },
      },
    },
  })
  async submitMarks(@Body() dto: SubmitMarksDto, @Request() req) {
    return await this.teacherService.submitMarks(dto, req.user.userId);
  }

  @Get('marks')
  async getMarks(
    @Request() req,
    @Query('examId') examId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return await this.teacherService.getMarks(
      req.user.userId,
      examId,
      studentId,
    );
  }

  @Get('assignments/exams')
  async getAssignedExams(@Request() req) {
    return await this.teacherService.getAssignedExams(req.user.userId);
  }

  @Get('assignments/exams/:examId/classes')
  async getAssignedClasses(@Param('examId') examId: string, @Request() req) {
    return await this.teacherService.getAssignedClasses(req.user.userId, examId);
  }

  @Get('assignments/exams/:examId/classes/:classId/students')
  async getAssignedStudents(
    @Param('examId') examId: string,
    @Param('classId') classId: string,
    @Request() req,
  ) {
    return await this.teacherService.getAssignedStudents(
      req.user.userId,
      examId,
      classId,
    );
  }

  @Get('assignments/exams/:examId/classes/:classId/students/:studentId/subjects')
  async getAssignedSubjectsWithMarks(
    @Param('examId') examId: string,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Request() req,
  ) {
    return await this.teacherService.getAssignedSubjectsWithMarks(
      req.user.userId,
      examId,
      classId,
      studentId,
    );
  }

  // ─── Homework ─────────────────────────────────────
  @Post('homework')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new homework assignment' })
  @ApiBody({
    type: CreateHomeworkDto,
    examples: {
      sample: {
        summary: 'Sample homework payload',
        value: {
          classId: 'uuid-class-001',
          subjectId: 'uuid-subject-001',
          teacherId: 'uuid-teacher-001',
          title: 'Mathematics Homework - Algebra',
          description: 'Solve exercises 1 to 10 from Chapter 3.',
          dueDate: '2026-04-05',
          sectionId: 'uuid-section-001',
          schoolId: 'uuid-school-001',
        },
      },
    },
  })
  async createHomework(@Body() dto: CreateHomeworkDto) {
    return await this.teacherService.createHomework(dto);
  }

  @Get('homework')
  async getHomework(
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return await this.teacherService.getHomework(classId, subjectId);
  }

  @Put('homework/:id')
  async updateHomework(
    @Param('id') id: string,
    @Body() dto: UpdateHomeworkDto,
  ) {
    return await this.teacherService.updateHomework(id, dto);
  }

  @Delete('homework/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHomework(@Param('id') id: string) {
    return await this.teacherService.deleteHomework(id);
  }

  // ─── Exams ───────────────────────────────────────
  @Get('exams')
  async getExams() {
    return await this.teacherService.getExams();
  }

  @Get('todays-classes')
  @ApiOperation({ summary: "Get today's classes for the logged-in teacher" })
  async getTodaysClasses(@Request() req, @Query('date') date?: string) {
    const teacherId = req.user.userId;
    return await this.teacherService.getTodaysClasses(teacherId, date);
  }
}
