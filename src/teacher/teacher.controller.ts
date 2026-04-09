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
  Patch,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { SubmitAttendanceDto } from '../attendance/dto/submit-attendance.dto';
import { SubmitMarksDto } from '../marks/dto/submit-marks.dto';
import {
  CreateHomeworkDto,
  UpdateHomeworkDto,
  UpdateStudentHomeworkStatusDto,
  BulkUpdateHomeworkStatusDto,
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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create homework for a specific class & section (auto-assigns to all students)' })
  @ApiBody({
    type: CreateHomeworkDto,
    examples: {
      sample: {
        summary: 'Sample homework payload',
        value: {
          classId: 'uuid-class-001',
          subjectId: 'uuid-subject-001',
          teacherId: 'uuid-teacher-001',
          title: 'Mathematics Chapter 3 – Algebra',
          description: 'Solve exercises 1 to 10 from Chapter 3.',
          dueDate: '2026-04-20',
          sectionId: 'uuid-section-001',
          schoolId: 'uuid-school-001',
        },
      },
    },
  })
  async createHomework(@Body() dto: CreateHomeworkDto, @Request() req) {
    // Inject the authenticated teacher's id
    dto.teacherId = req.user?.userId ?? dto.teacherId;
    return await this.teacherService.createHomework(dto);
  }

  @Get('homework')
  @ApiOperation({ summary: 'List homework for a class/section' })
  async getHomework(
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return await this.teacherService.getHomework(classId, subjectId, sectionId);
  }

  @Get('homework/:id')
  @ApiOperation({ summary: 'Get homework details (including per-student status)' })
  async getHomeworkById(@Param('id') id: string) {
    return await this.teacherService.getHomeworkById(id);
  }

  @Get('homework/:id/students')
  @ApiOperation({ summary: 'Get all student statuses for a homework assignment' })
  async getHomeworkStudentStatuses(@Param('id') id: string) {
    return await this.teacherService.getHomeworkStudentStatuses(id);
  }

  @Patch('homework/:id/students/:studentHomeworkId')
  @ApiOperation({ summary: 'Update a single student homework status (pending | done)' })
  @ApiBody({
    type: UpdateStudentHomeworkStatusDto,
    examples: {
      done: {
        summary: 'Mark as done',
        value: { status: 'done', comment: 'Great work!' },
      },
      pending: {
        summary: 'Reset to pending',
        value: { status: 'pending' },
      },
    },
  })
  async updateStudentStatus(
    @Param('id') _homeworkId: string,
    @Param('studentHomeworkId') studentHomeworkId: string,
    @Body() dto: UpdateStudentHomeworkStatusDto,
    @Request() req,
  ) {
    return await this.teacherService.updateStudentHomeworkStatus(
      studentHomeworkId,
      dto.status,
      req.user.userId,
      dto.comment,
    );
  }

  @Patch('homework/:id/students/bulk')
  @ApiOperation({ summary: 'Update ALL students status for a homework (pending | done)' })
  @ApiBody({
    type: BulkUpdateHomeworkStatusDto,
    examples: {
      markAllDone: {
        summary: 'Mark all students done',
        value: { status: 'done', comment: 'All completed in class.' },
      },
      resetAll: {
        summary: 'Reset all to pending',
        value: { status: 'pending' },
      },
    },
  })
  async bulkUpdateStudentStatuses(
    @Param('id') homeworkId: string,
    @Body() dto: BulkUpdateHomeworkStatusDto,
    @Request() req,
  ) {
    return await this.teacherService.bulkUpdateHomeworkStatus(
      homeworkId,
      dto.status,
      req.user.userId,
      dto.comment,
    );
  }

  @Put('homework/:id')
  @ApiOperation({ summary: 'Update homework title/description/dueDate' })
  async updateHomework(
    @Param('id') id: string,
    @Body() dto: UpdateHomeworkDto,
  ) {
    return await this.teacherService.updateHomework(id, dto);
  }

  @Delete('homework/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a homework assignment' })
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
