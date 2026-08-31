import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { Attendance } from '../attendance/entities/attendance.entity';
import { PeriodAttendance } from '../attendance/entities/period-attendance.entity';
import { TeacherAttendance } from '../attendance/entities/teacher-attendance.entity';
import { StudentHomework } from '../homework/entities/student-homework.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Marks } from '../marks/entities/marks.entity';
import { User } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';
import { Section } from '../sections/entities/section.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendance,
      PeriodAttendance,
      TeacherAttendance,
      StudentHomework,
      Homework,
      Marks,
      User,
      Class,
      Section,
    ]),
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService],
})
export class PerformanceModule {}
