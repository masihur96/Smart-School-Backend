import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marks } from './entities/marks.entity';

@Injectable()
export class MarksService {
  constructor(
    @InjectRepository(Marks)
    private marksRepository: Repository<Marks>,
  ) {}

  async submitMarks(data: any) {
    const marks = this.marksRepository.create(data.marks);
    return await this.marksRepository.save(marks);
  }

  async getMarks(examId?: string, studentId?: string) {
    const query = this.marksRepository.createQueryBuilder('marks');
    
    if (examId) {
      query.where('marks.examId = :examId', { examId });
    }
    
    if (studentId) {
      if (examId) {
        query.andWhere('marks.studentId = :studentId', { studentId });
      } else {
        query.where('marks.studentId = :studentId', { studentId });
      }
    }
    
    return await query.getMany();
  }
}
