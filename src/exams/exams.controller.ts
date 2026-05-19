import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CreateAcademicAssignmentDto } from './dto/create-academic-assignment.dto';
import { CreateExamDto, UpdateExamDto } from './dto/create-exam.dto';
import { SubmitMarksDto } from '../marks/dto/submit-marks.dto';

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

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an existing exam' })
  @HttpCode(HttpStatus.CREATED)
  async duplicateExam(@Param('id') id: string) {
    return await this.examsService.duplicateExam(id);
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
  @ApiOperation({ summary: 'Submit marks for an exam' })
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
  async submitMarks(@Body() data: SubmitMarksDto) {
    return await this.examsService.submitMarks(data);
  }

  @Get('results/:examId')
  async getResults(
    @Param('examId') examId: string,
    @Query('studentId') studentId?: string,
  ) {
    return await this.examsService.getResults(examId, studentId);
  }
}
