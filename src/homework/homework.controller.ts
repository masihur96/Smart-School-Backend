import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StudentHomeworkStatus } from './entities/student-homework.entity';

@ApiTags('Teacher')
@ApiBearerAuth('bearer')
@Controller('homework')
export class HomeworkController {
  constructor(private homeworkService: HomeworkService) {}

  @Post()
  async create(@Body() data: any) {
    return await this.homeworkService.create(data);
  }


  // Get homework with optional filters for class, section, and subject
  @Get()
  async findAll(
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return await this.homeworkService.findAll(classId, subjectId, sectionId);
  }

  @Get('student/:studentId')
  async getHomeworkForStudent(@Param('studentId') studentId: string) {
    return await this.homeworkService.getHomeworkForStudent(studentId);
  }

  @Get('details/:homeworkId')
  async getHomeworkDetails(@Param('homeworkId') homeworkId: string) {
    return await this.homeworkService.getHomeworkStatusByHomeworkId(homeworkId);
  }

  @Patch('status/:studentHomeworkId')
  async updateStatus(
    @Param('studentHomeworkId') studentHomeworkId: string,
    @Body('status') status: StudentHomeworkStatus,
    @Body('teacherId') teacherId: string,
    @Body('comment') comment?: string,
  ) {
    return await this.homeworkService.updateStudentStatus(
      studentHomeworkId,
      status,
      teacherId,
      comment,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.homeworkService.findById(id);
  }
  
  @Get(':id')
  async findOneOne(@Param('id') id: string) {
    return await this.homeworkService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return await this.homeworkService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.homeworkService.delete(id);
  }
}
