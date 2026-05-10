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
import { NotificationsService } from '../notifications/notifications.service';
import { SubjectsService } from '../subjects/subjects.service';

@Injectable()
export class HomeworkService {
  constructor(
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(StudentHomework)
    private studentHomeworkRepository: Repository<StudentHomework>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    private subjectsService: SubjectsService,
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

    // Send notifications
    const subject = await this.subjectsService.findById(data.subjectId);
    const subjectName = subject ? subject.name : 'Unknown Subject';

    for (const student of students) {
      this.notificationsService.sendToUser(
        student.id,
        '📖 New Homework Assigned',
        `New homework for ${subjectName} has been assigned.`,
        { homeworkId: savedHomework.id, type: 'HOMEWORK' },
      );
    }

    return savedHomework;
  }

  async findAll(
    classId?: string,
    subjectId?: string,
    sectionId?: string,
    date?: string,
  ) {
    const query = this.homeworkRepository.createQueryBuilder('homework');
    const conditions: string[] = [];
    const params: Record<string, any> = {};

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
    if (date) {
      conditions.push('homework.dueDate = :date');
      params.date = date;
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
    return await this.homeworkRepository.softDelete(id);
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
    const updateData: any = { status, updatedBy: teacherId };
    if (comment !== undefined) {
      updateData.comment = comment;
    }

    const result = await this.studentHomeworkRepository.update(
      { homeworkId },
      updateData,
    );

    return {
      updated: result.affected ?? 0,
      status,
      homeworkId,
    };
  }
}
