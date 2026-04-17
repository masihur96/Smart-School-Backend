import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { MarksService } from '../marks/marks.service';

import { AcademicAssignment } from './entities/academic-assignment.entity';
import { Class } from '../classes/entities/class.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateExamDto,
  UpdateExamDto,
  SubmitMarksDto,
} from './dto/create-exam.dto';
import { CreateAcademicAssignmentDto } from './dto/create-academic-assignment.dto';
@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    private marksService: MarksService,
    @InjectRepository(AcademicAssignment)
    private academicAssignmentRepository: Repository<AcademicAssignment>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(User)
    private userRepository: Repository<User>,

  ) {}

  async createExam(data: CreateExamDto) {
    const exam = this.examRepository.create(data);
    return await this.examRepository.save(exam);
  }

  async findAllExams() {
    return await this.examRepository.find({
      relations: ['assignments', 'results'],
    });
  }

  async findExamById(id: string) {
    return await this.examRepository.findOne({
      where: { id },
      relations: ['assignments', 'results'],
    });
  }

  async updateExam(id: string, data: UpdateExamDto) {
    const exam = await this.examRepository.findOne({
      where: { id },
      relations: ['assignments'],
    });
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    if (data.assignments) {
      const updatedAssignments = await Promise.all(
        data.assignments.map(async (assignDto) => {
          const classEntity = await this.classRepository.findOne({
            where: { id: assignDto.class_uid },
          });
          const subjectEntity = await this.subjectRepository.findOne({
            where: { id: assignDto.subject_uid },
          });
          const examinerEntity = await this.userRepository.findOne({
            where: { id: assignDto.examiner_uid },
          });

          if (!classEntity)
            throw new NotFoundException(
              `Class with ID ${assignDto.class_uid} not found`,
            );
          if (!subjectEntity)
            throw new NotFoundException(
              `Subject with ID ${assignDto.subject_uid} not found`,
            );
          if (!examinerEntity)
            throw new NotFoundException(
              `Examiner with ID ${assignDto.examiner_uid} not found`,
            );

          return this.academicAssignmentRepository.create({
            id: assignDto.id,
            examId: id,
            date: assignDto.date,
            syllabus: assignDto.syllabus,
            class: { uuid: classEntity.id, name: classEntity.name },
            subject: { uuid: subjectEntity.id, name: subjectEntity.name },
            examiner: { uuid: examinerEntity.id, name: examinerEntity.name },
          });
        }),
      );

      const existingAssignmentIds = exam.assignments.map((a) => a.id);
      const newAssignmentIds = updatedAssignments
        .map((a) => a.id)
        .filter((aId) => aId);
      const idsToRemove = existingAssignmentIds.filter(
        (aId) => !newAssignmentIds.includes(aId),
      );

      if (idsToRemove.length > 0) {
        await this.academicAssignmentRepository.softDelete(idsToRemove);
      }

      exam.assignments = updatedAssignments;
      
      delete data.assignments;
    }

    // Merge data into the existing exam entity
    Object.assign(exam, data);

    return await this.examRepository.save(exam);
  }

  async deleteExam(id: string) {
    return await this.examRepository.softDelete(id);
  }

  async setPublishStatus(id: string, isPublished: boolean) {
    const exam = await this.examRepository.findOne({ where: { id } });
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    await this.examRepository.update(id, { isPublished });
    return await this.examRepository.findOne({
      where: { id },
      relations: ['assignments'],
    });
  }

  async addAcademicAssignment(
    examId: string,
    data: CreateAcademicAssignmentDto,
  ) {
    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    const classEntity = await this.classRepository.findOne({
      where: { id: data.class_uid },
    });
    if (!classEntity)
      throw new NotFoundException(`Class with ID ${data.class_uid} not found`);

    const subjectEntity = await this.subjectRepository.findOne({
      where: { id: data.subject_uid },
    });
    if (!subjectEntity)
      throw new NotFoundException(
        `Subject with ID ${data.subject_uid} not found`,
      );

    const examinerEntity = await this.userRepository.findOne({
      where: { id: data.examiner_uid },
    });
    if (!examinerEntity)
      throw new NotFoundException(
        `Examiner with ID ${data.examiner_uid} not found`,
      );

    const assignment = this.academicAssignmentRepository.create({
      examId,
      date: data.date,
      syllabus: data.syllabus,
      class: { uuid: classEntity.id, name: classEntity.name },
      subject: { uuid: subjectEntity.id, name: subjectEntity.name },
      examiner: { uuid: examinerEntity.id, name: examinerEntity.name },
    });
    return await this.academicAssignmentRepository.save(assignment);
  }

  async findAssignmentsByExaminer(examinerId: string) {
    // using query builder to use exact JSON containment or just TypeORM's find options
    const query = this.academicAssignmentRepository
      .createQueryBuilder('assignment')
      .where(`assignment.examiner->>'uuid' = :examinerId`, { examinerId });
      
    // Return all assignments with related exam info
    return await query.leftJoinAndSelect('assignment.exam', 'exam').getMany();
  }

  async submitMarks(data: any) {
    return await this.marksService.submitMarks(data);
  }


  async getResults(examId: string, studentId?: string) {
    return await this.marksService.getMarks(examId, studentId);
  }


  async findExamsByClass(classId: string) {
    const assignments = await this.academicAssignmentRepository
      .createQueryBuilder('assignment')
      .where(`assignment.class->>'uuid' = :classId`, { classId })
      .leftJoinAndSelect('assignment.exam', 'exam')
      .getMany();

    // Group by exam and return unique list of exams
    const examsMap = new Map<string, Exam>();
    assignments.forEach((a) => {
      if (a.exam && !examsMap.has(a.exam.id)) {
        examsMap.set(a.exam.id, a.exam);
      }
    });

    return Array.from(examsMap.values());
  }

  async getExamAssignments(examId: string, classId: string) {
    return await this.academicAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.examId = :examId', { examId })
      .andWhere(`assignment.class->>'uuid' = :classId`, { classId })
      .getMany();
  }

  async getStudentResults(examId: string, studentId: string) {
    return await this.marksService.getMarks(examId, studentId);
  }

}
