import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  async submitAttendance(data: any) {
    const records = data.records.map(record => ({
      ...record,
      date: data.date,
      takenBy: data.takenBy,
      classId: data.classId,
    }));
    
    const attendance = this.attendanceRepository.create(records);
    return await this.attendanceRepository.save(attendance);
  }

  async getAttendance(classId: string, date?: string) {
    const query = this.attendanceRepository.createQueryBuilder('attendance')
      .where('attendance.classId = :classId', { classId });
    
    if (date) {
      query.andWhere('attendance.date = :date', { date });
    }
    
    return await query.getMany();
  }

  async getStudentAttendance(studentId: string) {
    return await this.attendanceRepository.find({ where: { studentId } });
  }
}
