import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Homework } from './entities/homework.entity';
import {
  CreateHomeworkDto,
  UpdateHomeworkDto,
} from './dto/create-homework.dto';
import {
  StudentHomework,
  StudentHomeworkStatus,
} from './entities/student-homework.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class HomeworkService {
  constructor(
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(StudentHomework)
    private studentHomeworkRepository: Repository<StudentHomework>,
    private usersService: UsersService,
  ) {}

  async create(data: CreateHomeworkDto) {
    const homework = this.homeworkRepository.create(data);
    const savedHomework = await this.homeworkRepository.save(homework);

    // Auto-assign to all students in the class
    const students = await this.usersService.findStudentsByClass(
      data.classId,
      data.sectionId,
    );

    const studentHomeworks = students.map((student) =>
      this.studentHomeworkRepository.create({
        homeworkId: savedHomework.id,
        studentId: student.id,
        status: StudentHomeworkStatus.PENDING,
      }),
    );

    await this.studentHomeworkRepository.save(studentHomeworks);

    return savedHomework;
  }

  async findAll(classId?: string, subjectId?: string, sectionId?: string) {
    const query = this.homeworkRepository.createQueryBuilder('homework');
    const conditions: string[] = [];
    const params: Record<string, string> = {};

    if (classId) {
      conditions.push('homework.classId = :classId');
      params.classId = classId;
    }
    if (subjectId) {
      conditions.push('homework.subjectId = :subjectId');
      params.subjectId = subjectId;
    }
    if (sectionId) {
      conditions.push('homework.sectionId = :sectionId');
      params.sectionId = sectionId;
    }

    if (conditions.length > 0) {
      query.where(conditions.join(' AND '), params);
    }

    return await query.orderBy('homework.createdAt', 'DESC').getMany();
  }

  async findById(id: string) {
    return await this.homeworkRepository.findOne({
      where: { id },
      relations: ['studentHomeworks', 'studentHomeworks.student'],
    });
  }

  async update(id: string, data: UpdateHomeworkDto) {
    await this.homeworkRepository.update(id, data);
    return await this.homeworkRepository.findOne({ where: { id } });
  }

  async delete(id: string) {
    return await this.homeworkRepository.delete(id);
  }

  async updateStudentStatus(
    studentHomeworkId: string,
    status: StudentHomeworkStatus,
    teacherId: string,
    comment?: string,
  ) {
    await this.studentHomeworkRepository.update(studentHomeworkId, {
      status,
      updatedBy: teacherId,
      comment,
    });
    return await this.studentHomeworkRepository.findOne({
      where: { id: studentHomeworkId },
      relations: ['student'],
    });
  }

  async getHomeworkForStudent(studentId: string) {
    return await this.studentHomeworkRepository.find({
      where: { studentId },
      relations: ['homework'],
      order: { createdAt: 'DESC' },
    });
  }

  async getHomeworkStatusByHomeworkId(homeworkId: string) {
    return await this.studentHomeworkRepository.find({
      where: { homeworkId },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });
  }

  async bulkUpdateStudentStatuses(
    homeworkId: string,
    status: StudentHomeworkStatus,
    teacherId: string,
    comment?: string,
  ) {
    const studentHomeworks = await this.studentHomeworkRepository.find({
      where: { homeworkId },
    });

    if (studentHomeworks.length === 0) {
      return { updated: 0 };
    }

    await this.studentHomeworkRepository.update(
      studentHomeworks.map((sh) => sh.id),
      { status, updatedBy: teacherId, ...(comment ? { comment } : {}) },
    );

    return {
      updated: studentHomeworks.length,
      status,
      homeworkId,
    };
  }
}
