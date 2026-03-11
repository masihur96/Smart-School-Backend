import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { AttendanceModule } from '../attendance/attendance.module';
import { MarksModule } from '../marks/marks.module';
import { HomeworkModule } from '../homework/homework.module';
import { ExamsModule } from '../exams/exams.module';

@Module({
  imports: [AttendanceModule, MarksModule, HomeworkModule, ExamsModule],
  providers: [TeacherService],
  controllers: [TeacherController],
  exports: [TeacherService],
})
export class TeacherModule {}
