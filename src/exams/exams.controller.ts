import { Controller, Get, Post, Body, Param, Put, Patch, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateAcademicAssignmentDto } from './dto/create-academic-assignment.dto';
import { CreateExamDto, UpdateExamDto } from './dto/create-exam.dto';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Controller('exams')
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new exam' })
  async createExam(@Body() data: CreateExamDto) {
    return await this.examsService.createExam(data);
  }

  @Post(':id/assignments')
  @HttpCode(HttpStatus.CREATED)
  async addAcademicAssignment(
    @Param('id') id: string,
    @Body() dto: CreateAcademicAssignmentDto,
  ) {
    return await this.examsService.addAcademicAssignment(id, dto);
  }

  @Get()
  async findAllExams() {
    return await this.examsService.findAllExams();
  }

  @Get(':id')
  async findExam(@Param('id') id: string) {
    return await this.examsService.findExamById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update exam details' })
  async updateExam(@Param('id') id: string, @Body() data: UpdateExamDto) {
    return await this.examsService.updateExam(id, data);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish or unpublish an exam' })
  async publishExam(
    @Param('id') id: string,
    @Body() body: { isPublished: boolean },
  ) {
    return await this.examsService.setPublishStatus(id, body.isPublished);
  }

  @Delete(':id')
  async deleteExam(@Param('id') id: string) {
    return await this.examsService.deleteExam(id);
  }

  @Post('marks/submit')
  async submitMarks(@Body() data: any) {
    return await this.examsService.submitMarks(data);
  }

  @Get('results/:examId')
  async getResults(@Param('examId') examId: string, @Query('studentId') studentId?: string) {
    return await this.examsService.getResults(examId, studentId);
  }
}
