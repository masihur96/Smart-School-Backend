import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { SubjectsService } from '../subjects/subjects.service';
import { ExamsService } from '../exams/exams.service';

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private classesService: ClassesService,
    private subjectsService: SubjectsService,
    private examsService: ExamsService,
  ) {}

  // User management
  async createUser(data: any) {
    return await this.usersService.create(data);
  }

  async getUsers(role?: any, page?: number, limit?: number, isActive?: boolean) {
    return await this.usersService.findAll(role, page, limit, isActive);
  }

  async updateUser(id: string, data: any) {
    return await this.usersService.update(id, data);
  }

  async deleteUser(id: string) {
    return await this.usersService.delete(id);
  }

  // Class management
  async createClass(data: any) {
    return await this.classesService.create(data);
  }

  async getClasses() {
    return await this.classesService.findAll();
  }

  async updateClass(id: string, data: any) {
    return await this.classesService.update(id, data);
  }

  async deleteClass(id: string) {
    return await this.classesService.delete(id);
  }

  // Subject management
  async createSubject(data: any) {
    return await this.subjectsService.create(data);
  }

  async getSubjects() {
    return await this.subjectsService.findAll();
  }

  async updateSubject(id: string, data: any) {
    return await this.subjectsService.update(id, data);
  }

  async deleteSubject(id: string) {
    return await this.subjectsService.delete(id);
  }

  // Exam management
  async createExam(data: any) {
    return await this.examsService.createExam(data);
  }

  async getExams() {
    return await this.examsService.findAllExams();
  }

  async updateExam(id: string, data: any) {
    return await this.examsService.updateExam(id, data);
  }

  async deleteExam(id: string) {
    return await this.examsService.deleteExam(id);
  }
}
