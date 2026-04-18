import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../schools/entities/school.entity';
import { CreateSchoolDto } from '../schools/dto/create-school.dto';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { SubjectsService } from '../subjects/subjects.service';
import { ExamsService } from '../exams/exams.service';
import { UserRole } from '../users/entities/user.entity';
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
import { MarksService } from '../marks/marks.service';
import { SubmitMarksDto } from '../marks/dto/submit-marks.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    private usersService: UsersService,
    private classesService: ClassesService,
    private subjectsService: SubjectsService,
    private examsService: ExamsService,
    private marksService: MarksService,
  ) {}

  // School management
  async createSchool(data: CreateSchoolDto) {
    const school = this.schoolRepository.create(data);
    return await this.schoolRepository.save(school);
  }

  // User management
  async createUser(data: CreateUserDto) {
    return await this.usersService.create(data);
  }

  async getUsers(
    role?: UserRole,
    page?: number,
    limit?: number,
    isActive?: boolean,
  ) {
    return await this.usersService.findAll(role, page, limit, isActive);
  }

  async updateUser(id: string, data: UpdateUserDto) {
    return await this.usersService.update(id, data);
  }

  async deleteUser(id: string) {
    return await this.usersService.delete(id);
  }

  // Class management
  async createClass(data: CreateClassDto) {
    return await this.classesService.create(data);
  }

  async getClasses() {
    return await this.classesService.findAll();
  }

  async updateClass(id: string, data: UpdateClassDto) {
    return await this.classesService.update(id, data);
  }

  async deleteClass(id: string) {
    return await this.classesService.delete(id);
  }

  // Subject management
  async createSubject(data: CreateSubjectDto) {
    return await this.subjectsService.create(data);
  }

  async getSubjects() {
    return await this.subjectsService.findAll();
  }

  async updateSubject(id: string, data: UpdateSubjectDto) {
    return await this.subjectsService.update(id, data);
  }

  async deleteSubject(id: string) {
    return await this.subjectsService.delete(id);
  }

  // Exam management
  async createExam(data: CreateExamDto) {
    return await this.examsService.createExam(data);
  }

  async getExams() {
    return await this.examsService.findAllExams();
  }

  async updateExam(id: string, data: UpdateExamDto) {
    return await this.examsService.updateExam(id, data);
  }

  async deleteExam(id: string) {
    return await this.examsService.deleteExam(id);
  }

  async addAcademicAssignment(
    examId: string,
    data: CreateAcademicAssignmentDto,
  ) {
    return await this.examsService.addAcademicAssignment(examId, data);
  }

  // Marks management
  async submitMarks(data: SubmitMarksDto) {
    return await this.marksService.submitMarks(data);
  }

  async getMarks(examId?: string, studentId?: string) {
    return await this.marksService.getMarks(examId, studentId);
  }

  async deleteMark(id: string) {
    return await this.marksService.deleteMark(id);
  }
}
