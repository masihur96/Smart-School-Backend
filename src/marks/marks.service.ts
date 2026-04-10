import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marks } from './entities/marks.entity';
import { SubmitMarksDto } from './dto/submit-marks.dto';

@Injectable()
export class MarksService {
  constructor(
    @InjectRepository(Marks)
    private marksRepository: Repository<Marks>,
  ) { }

  async submitMarks(data: SubmitMarksDto) {
    const results: Marks[] = [];

    for (const markItem of data.marks) {
      // Check if marks already exist for this student, exam, and subject
      let marksEntry = await this.marksRepository.findOne({
        where: {
          studentId: markItem.studentId,
          examId: data.examId,
          subjectId: markItem.subjectId,
        },
      });

      if (marksEntry) {
        // Update existing marks
        marksEntry.marksObtained = markItem.marksObtained;
        marksEntry.totalMarks = markItem.totalMarks;
        marksEntry.teacherId = data.teacherId;
      } else {
        // Create new marks entry
        marksEntry = this.marksRepository.create({
          ...markItem,
          examId: data.examId,
          teacherId: data.teacherId,
          schoolId: data.schoolId,
        });
      }

      results.push(await this.marksRepository.save(marksEntry));
    }

    return results;
  }

  async getMarks(examId?: string, studentId?: string) {
    const query = this.marksRepository.createQueryBuilder('marks');

    if (examId) {
      query.andWhere('marks.examId = :examId', { examId });
    }

    if (studentId) {
      query.andWhere('marks.studentId = :studentId', { studentId });
    }

    return await query.getMany();
  }

  async findByStudent(studentId: string) {
    return await this.marksRepository.find({
      where: { studentId },
      relations: ['exam', 'student', 'subject', 'teacher'],
      order: { createdAt: 'DESC' },
    });
  }

  async deleteMark(id: string) {
    return await this.marksRepository.softDelete(id);
  }
}
