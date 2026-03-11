import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  async submitAttendance(data: SubmitAttendanceDto) {
    const results: Attendance[] = [];
    
    for (const record of data.records) {
      // Check if attendance already exists for this student on this date and class
      let attendance = await this.attendanceRepository.findOne({
        where: {
          studentId: record.studentId,
          classId: data.classId,
          date: data.date,
        },
      });

      if (attendance) {
        // Update existing record
        attendance.status = record.status;
        attendance.takenBy = data.takenBy;
      } else {
        // Create new record
        attendance = this.attendanceRepository.create({
          ...record,
          date: data.date,
          takenBy: data.takenBy,
          classId: data.classId,
          schoolId: 'placeholder-school-id', // Should ideally come from JWT or DTO
        });
      }
      
      results.push(await this.attendanceRepository.save(attendance));
    }
    
    return results;
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
    return await this.attendanceRepository.find({ 
      where: { studentId },
      order: { date: 'DESC' }
    });
  }
}
