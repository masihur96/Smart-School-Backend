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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
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
import { CreateSchoolDto } from '../schools/dto/create-school.dto';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── Schools ───────────────────────────────────────
  @Post('schools')
  @HttpCode(HttpStatus.CREATED)
  async createSchool(@Body() dto: CreateSchoolDto) {
    return await this.adminService.createSchool(dto);
  }

  // ─── Users ───────────────────────────────────────
  @Get('users')
  async getUsers(
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
  async getClasses() {
    return await this.adminService.getClasses();
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
  async getSubjects() {
    return await this.adminService.getSubjects();
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
  async getExams() {
    return await this.adminService.getExams();
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
  async submitMarks(@Body() dto: SubmitMarksDto) {
    return await this.adminService.submitMarks(dto);
  }

  @Get('marks')
  async getMarks(
    @Query('examId') examId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return await this.adminService.getMarks(examId, studentId);
  }

  @Delete('marks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMark(@Param('id') id: string) {
    return await this.adminService.deleteMark(id);
  }
}
