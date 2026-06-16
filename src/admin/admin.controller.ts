import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { AdminService } from './admin.service';
import { CreateUserDto, UpdateUserDto } from '../users/dto/create-user.dto';
import {
  CreateClassDto,
  UpdateClassDto,
} from '../classes/dto/create-class.dto';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
} from '../subjects/dto/create-subject.dto';
import { CreateExamDto, UpdateExamDto } from '../exams/dto/create-exam.dto';
import { CreateAcademicAssignmentDto } from '../exams/dto/create-academic-assignment.dto';
import { SubmitMarksDto } from '../marks/dto/submit-marks.dto';
import { CreateSchoolDto, UpdateSchoolDto } from '../schools/dto/create-school.dto';
import {
  CreateHomeworkDto,
  UpdateHomeworkDto,
} from '../homework/dto/create-homework.dto';

/** Shape returned by JwtStrategy.validate() */
interface JwtUser {
  id: string;
  userId: string;
  role: string;
  schoolId: string | null;
}

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── Schools ───────────────────────────────────────
  @Get('schools')
  async getSchools(@CurrentUser() user: JwtUser) {
    return await this.adminService.getSchools(user.schoolId, user.role);
  }

  @Post('schools')
  @HttpCode(HttpStatus.CREATED)
  async createSchool(@Body() dto: CreateSchoolDto) {
    return await this.adminService.createSchool(dto);
  }

  @Put('schools/:id')
  async updateSchool(
    @Param('id') id: string,
    @Body() dto: UpdateSchoolDto,
    @CurrentUser() user: JwtUser,
  ) {
    return await this.adminService.updateSchool(id, dto, user.schoolId, user.role);
  }

  @Delete('schools/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSchool(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return await this.adminService.deleteSchool(id, user.schoolId, user.role);
  }

  // ─── Users ───────────────────────────────────────
  @Get('users')
  async getUsers(
    @CurrentUser() user: JwtUser,
    @Query('role') role?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return await this.adminService.getUsers(
      role as any,
      page,
      limit,
      isActive,
      search,
      classId,
      sectionId,
      user.schoolId,
      user.role,
    );
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserDto) {
    return await this.adminService.createUser(dto);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return await this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    return await this.adminService.deleteUser(id);
  }
  
  // ─── Classes ─────────────────────────────────────
  @Get('classes')
  async getClasses(@CurrentUser() user: JwtUser) {
    return await this.adminService.getClasses(user.schoolId, user.role);
  }

  @Post('classes')
  @HttpCode(HttpStatus.CREATED)
  async createClass(@Body() dto: CreateClassDto) {
    return await this.adminService.createClass(dto);
  }

  @Put('classes/:id')
  async updateClass(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return await this.adminService.updateClass(id, dto);
  }

  @Delete('classes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClass(@Param('id') id: string) {
    return await this.adminService.deleteClass(id);
  }

  // ─── Subjects ────────────────────────────────────
  @Get('subjects')
  async getSubjects(@CurrentUser() user: JwtUser) {
    return await this.adminService.getSubjects(user.schoolId, user.role);
  }

  @Post('subjects')
  @HttpCode(HttpStatus.CREATED)
  async createSubject(@Body() dto: CreateSubjectDto) {
    return await this.adminService.createSubject(dto);
  }

  @Put('subjects/:id')
  async updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return await this.adminService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubject(@Param('id') id: string) {
    return await this.adminService.deleteSubject(id);
  }

  // ─── Exams ───────────────────────────────────────
  @Get('exams')
  async getExams(@CurrentUser() user: JwtUser) {
    return await this.adminService.getExams(user.schoolId, user.role);
  }

  @Post('exams')
  @HttpCode(HttpStatus.CREATED)
  async createExam(@Body() dto: CreateExamDto) {
    return await this.adminService.createExam(dto);
  }

  @Post('exams/:id/assignments')
  @HttpCode(HttpStatus.CREATED)
  async addAcademicAssignment(
    @Param('id') id: string,
    @Body() dto: CreateAcademicAssignmentDto,
  ) {
    return await this.adminService.addAcademicAssignment(id, dto);
  }

  @Post('exams/:id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate an existing exam with all its assignments' })
  async duplicateExam(@Param('id') id: string) {
    return await this.adminService.duplicateExam(id);
  }

  @Put('exams/:id')
  async updateExam(@Param('id') id: string, @Body() dto: UpdateExamDto) {
    return await this.adminService.updateExam(id, dto);
  }

  @Delete('exams/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExam(@Param('id') id: string) {
    return await this.adminService.deleteExam(id);
  }

  // ─── Marks ───────────────────────────────────────
  @Post('marks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit or update marks for multiple students' })
  @ApiBody({
    type: SubmitMarksDto,
    examples: {
      sample: {
        summary: 'Sample marks payload',
        value: {
          examId: '79b88307-59d4-42f0-9b6f-7f7e9a8d2e8b',
          teacherId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          schoolId: 'd1a8e234-789a-4cde-b567-f8e9d0c1b2a3',
          marks: [
            {
              studentId: 'a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p',
              subjectId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
              marksObtained: 85.5,
              totalMarks: 100,
            },
          ],
        },
      },
    },
  })
  async submitMarks(@Body() dto: SubmitMarksDto) {
    return await this.adminService.submitMarks(dto);
  }

  @Get('marks')
  async getMarks(
    @CurrentUser() user: JwtUser,
    @Query('examId') examId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return await this.adminService.getMarks(
      examId,
      studentId,
      user.schoolId,
      user.role,
    );
  }

  @Delete('marks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMark(@Param('id') id: string) {
    return await this.adminService.deleteMark(id);
  }

  // ─── Homework ────────────────────────────────────
  @Get('homework')
  @ApiOperation({
    summary: 'Get homework filtered by date, class, section, subject',
  })
  async getHomework(
    @CurrentUser() user: JwtUser,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('date') date?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    // Scope to the logged-in admin's school (SUPER_ADMIN may pass an explicit schoolId)
    const effectiveSchoolId =
      user.role === UserRole.SUPER_ADMIN
        ? schoolId || user.schoolId
        : user.schoolId;

    return await this.adminService.getHomeworks(
      classId,
      subjectId,
      sectionId,
      date,
      effectiveSchoolId,
    );
  }

  @Post('homework')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit homework for any class, section and subject',
  })
  async createHomework(@Body() dto: CreateHomeworkDto) {
    return await this.adminService.createHomework(dto);
  }

  @Put('homework/:id')
  async updateHomework(@Param('id') id: string, @Body() dto: UpdateHomeworkDto) {
    return await this.adminService.updateHomework(id, dto);
  }

  @Delete('homework/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHomework(@Param('id') id: string) {
    return await this.adminService.deleteHomework(id);
  }
}
