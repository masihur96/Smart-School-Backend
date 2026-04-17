import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';
import { Routine, Day } from './entities/routine.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class GeneralService {
  constructor(
    @InjectRepository(Notice)
    private noticeRepository: Repository<Notice>,
    @InjectRepository(Routine)
    private routineRepository: Repository<Routine>,
    private notificationsService: NotificationsService,
  ) { }

  // Notices
  async createNotice(data: Partial<Notice>) {
    const notice = this.noticeRepository.create(data);
    const savedNotice = await this.noticeRepository.save(notice);

    // Send school-wide notification
    this.notificationsService.sendToTopic(
      `school_${data.schoolId}_notices`,
      '📢 New School Notice',
      savedNotice.title,
      { noticeId: savedNotice.id, type: 'NOTICE' },
    );

    return savedNotice;
  }

  async getAllNotices() {
    return await this.noticeRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getNoticeById(id: string) {
    return await this.noticeRepository.findOne({ where: { id } });
  }

  async updateNotice(id: string, data: Partial<Notice>) {
    await this.noticeRepository.update(id, data);
    return await this.noticeRepository.findOne({ where: { id } });
  }

  async deleteNotice(id: string) {
    return await this.noticeRepository.softDelete(id);
  }

  // Routines
  async createRoutine(data: Partial<Routine>) {
    if (data.startTime) data.startTime = this.formatTime(data.startTime);
    if (data.endTime) data.endTime = this.formatTime(data.endTime);
    const routine = this.routineRepository.create(data);
    return await this.routineRepository.save(routine);
  }

  async getRoutineByClass(classId: string, sectionId?: string) {
    const where: any = { classId };
    if (sectionId) {
      where.sectionId = sectionId;
    }
    return await this.routineRepository.find({
      where,
      relations: [
        'classEntity',
        'subjectEntity',
        'teacherEntity',
        'sectionEntity',
      ],
    });
  }

  async getAllRoutines() {
    return await this.routineRepository.find();
  }

  async updateRoutine(id: string, data: Partial<Routine>) {
    if (data.startTime) data.startTime = this.formatTime(data.startTime);
    if (data.endTime) data.endTime = this.formatTime(data.endTime);
    await this.routineRepository.update(id, data);
    return await this.routineRepository.findOne({ where: { id } });
  }

  async deleteRoutine(id: string) {
    return await this.routineRepository.softDelete(id);
  }

  async getRoutineByTeacherAndDay(teacherId: string, day: Day) {
    return await this.routineRepository.find({
      where: { teacherId, day },
      relations: ['classEntity', 'subjectEntity', 'teacherEntity', 'sectionEntity'],
    });
  }

  private formatTime(timeStr: string): string {
    if (!timeStr) return timeStr;
    // Check if it's already in HH:mm:ss or HH:mm format
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)) {
      return timeStr;
    }

    // Handle AM/PM format
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const modifier = match[3].toUpperCase();

      if (hours === 12) {
        hours = modifier === 'AM' ? 0 : 12;
      } else if (modifier === 'PM') {
        hours += 12;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    }

    return timeStr;
  }
}
