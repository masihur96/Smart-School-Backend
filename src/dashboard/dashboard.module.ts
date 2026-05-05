import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { User } from '../users/entities/user.entity';
import { School } from '../schools/entities/school.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PricingPlan } from '../pricing/entities/pricing-plan.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { TeacherAttendance } from '../attendance/entities/teacher-attendance.entity';
import { Homework } from '../homework/entities/homework.entity';
import { StudentHomework } from '../homework/entities/student-homework.entity';
import { Notice } from '../general/entities/notice.entity';
import { Exam } from '../exams/entities/exam.entity';
import { AcademicAssignment } from '../exams/entities/academic-assignment.entity';
import { Marks } from '../marks/entities/marks.entity';
import { Marquee } from '../general/entities/marquee.entity';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      School,
      Subscription,
      PricingPlan,
      Attendance,
      TeacherAttendance,
      Homework,
      StudentHomework,
      Notice,
      Exam,
      AcademicAssignment,
      Marks,
      Marquee,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
