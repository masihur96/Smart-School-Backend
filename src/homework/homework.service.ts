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
    schoolId?: string,
  ) {
    const query = this.homeworkRepository.createQueryBuilder('homework')
      .leftJoinAndSelect('homework.classEntity', 'h_class')
      .leftJoinAndSelect('homework.subjectEntity', 'h_subject')
      .leftJoinAndSelect('homework.teacherEntity', 'h_teacher')
      .leftJoinAndSelect('homework.sectionEntity', 'h_section');

    if (classId && classId !== 'null') {

      query.andWhere('homework.classId = :classId', { classId });
    }
    if (subjectId && subjectId !== 'null') {
      query.andWhere('homework.subjectId = :subjectId', { subjectId });
    }
    if (sectionId) {
      if (sectionId === 'null') {
        query.andWhere('homework.sectionId IS NULL');
      } else {
        query.andWhere('homework.sectionId = :sectionId', { sectionId });
      }
    }
    if (date && date !== 'null') {
      query.andWhere('homework.dueDate = :date', { date });
    }
    if (schoolId && schoolId !== 'null') {
      query.andWhere('homework.schoolId = :schoolId', { schoolId });
    }

    return await query.orderBy('homework.createdAt', 'DESC').getMany();

  }

  async findById(id: string) {
    return await this.homeworkRepository.findOne({
      where: { id },
      relations: [
        'studentHomeworks',
        'studentHomeworks.student',
        'classEntity',
        'subjectEntity',
        'teacherEntity',
        'sectionEntity',
      ],
    });
  }

  async update(id: string, data: UpdateHomeworkDto) {
    await this.homeworkRepository.update(id, data);
    return await this.homeworkRepository.findOne({
      where: { id },
      relations: ['classEntity', 'subjectEntity', 'teacherEntity', 'sectionEntity'],
    });
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
      relations: [
        'homework',
        'homework.classEntity',
        'homework.subjectEntity',
        'homework.teacherEntity',
        'homework.sectionEntity',
      ],
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
