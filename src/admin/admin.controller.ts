import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Users endpoints
  @Get('users')
  async getUsers(
    @Query('role') role?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.adminService.getUsers(role, page, limit);
  }

  @Post('users')
  async createUser(@Body() data: any) {
    return await this.adminService.createUser(data);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return await this.adminService.updateUser(id, data);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return await this.adminService.deleteUser(id);
  }

  // Classes endpoints
  @Get('classes')
  async getClasses() {
    return await this.adminService.getClasses();
  }

  @Post('classes')
  async createClass(@Body() data: any) {
    return await this.adminService.createClass(data);
  }

  @Put('classes/:id')
  async updateClass(@Param('id') id: string, @Body() data: any) {
    return await this.adminService.updateClass(id, data);
  }

  @Delete('classes/:id')
  async deleteClass(@Param('id') id: string) {
    return await this.adminService.deleteClass(id);
  }

  // Subjects endpoints
  @Get('subjects')
  async getSubjects() {
    return await this.adminService.getSubjects();
  }

  @Post('subjects')
  async createSubject(@Body() data: any) {
    return await this.adminService.createSubject(data);
  }

  @Put('subjects/:id')
  async updateSubject(@Param('id') id: string, @Body() data: any) {
    return await this.adminService.updateSubject(id, data);
  }

  @Delete('subjects/:id')
  async deleteSubject(@Param('id') id: string) {
    return await this.adminService.deleteSubject(id);
  }

  // Exams endpoints
  @Get('exams')
  async getExams() {
    return await this.adminService.getExams();
  }

  @Post('exams')
  async createExam(@Body() data: any) {
    return await this.adminService.createExam(data);
  }

  @Put('exams/:id')
  async updateExam(@Param('id') id: string, @Body() data: any) {
    return await this.adminService.updateExam(id, data);
  }

  @Delete('exams/:id')
  async deleteExam(@Param('id') id: string) {
    return await this.adminService.deleteExam(id);
  }
}
