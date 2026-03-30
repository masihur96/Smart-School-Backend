import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { ExamResult } from './entities/exam-result.entity';
import { AcademicAssignment } from './entities/academic-assignment.entity';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(ExamResult)
    private examResultRepository: Repository<ExamResult>,
    @InjectRepository(AcademicAssignment)
    private academicAssignmentRepository: Repository<AcademicAssignment>,
  ) {}

  async createExam(data: any) {
    const exam = this.examRepository.create(data);
    return await this.examRepository.save(exam);
  }

  async findAllExams() {
    return await this.examRepository.find({ relations: ['assignments', 'results'] });
  }

  async findExamById(id: string) {
    return await this.examRepository.findOne({ where: { id }, relations: ['assignments', 'results'] });
  }

  async updateExam(id: string, data: any) {
    await this.examRepository.update(id, data);
    return await this.examRepository.findOne({ where: { id }, relations: ['assignments'] });
  }

  async deleteExam(id: string) {
    return await this.examRepository.delete(id);
  }

  async addAcademicAssignment(examId: string, data: any) {
    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    const assignment = this.academicAssignmentRepository.create({
      ...data,
      examId,
    });
    return await this.academicAssignmentRepository.save(assignment);
  }

  async submitMarks(data: any) {
    const results = this.examResultRepository.create(data.marks.map(mark => ({
      ...mark,
      examId: data.examId,
    })));
    return await this.examResultRepository.save(results);
  }

  async getResults(examId: string, studentId?: string) {
    const query = this.examResultRepository.createQueryBuilder('result')
      .where('result.examId = :examId', { examId });
    
    if (studentId) {
      query.andWhere('result.studentId = :studentId', { studentId });
    }
    
    return await query.getMany();
  }
}
