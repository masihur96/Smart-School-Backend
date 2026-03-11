import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';
import { Routine } from './entities/routine.entity';

@Injectable()
export class GeneralService {
  constructor(
    @InjectRepository(Notice)
    private noticeRepository: Repository<Notice>,
    @InjectRepository(Routine)
    private routineRepository: Repository<Routine>,
  ) {}

  // Notices
  async createNotice(data: any) {
    const notice = this.noticeRepository.create(data);
    return await this.noticeRepository.save(notice);
  }

  async getAllNotices() {
    return await this.noticeRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getNoticeById(id: string) {
    return await this.noticeRepository.findOne({ where: { id } });
  }

  async updateNotice(id: string, data: any) {
    await this.noticeRepository.update(id, data);
    return await this.noticeRepository.findOne({ where: { id } });
  }

  async deleteNotice(id: string) {
    return await this.noticeRepository.delete(id);
  }

  // Routines
  async createRoutine(data: any) {
    const routine = this.routineRepository.create(data);
    return await this.routineRepository.save(routine);
  }

  async getRoutineByClass(classId: string) {
    return await this.routineRepository.find({ where: { classId } });
  }

  async getAllRoutines() {
    return await this.routineRepository.find();
  }

  async updateRoutine(id: string, data: any) {
    await this.routineRepository.update(id, data);
    return await this.routineRepository.findOne({ where: { id } });
  }

  async deleteRoutine(id: string) {
    return await this.routineRepository.delete(id);
  }
}
