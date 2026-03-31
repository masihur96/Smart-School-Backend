import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { AttendanceModule } from '../attendance/attendance.module';
import { MarksModule } from '../marks/marks.module';
import { HomeworkModule } from '../homework/homework.module';
import { ExamsModule } from '../exams/exams.module';
import { UsersModule } from '../users/users.module';
import { GeneralModule } from '../general/general.module';

@Module({
  imports: [
    AttendanceModule,
    MarksModule,
    HomeworkModule,
    ExamsModule,
    UsersModule,
    GeneralModule,
  ],
  providers: [TeacherService],
  controllers: [TeacherController],
  exports: [TeacherService],
})
export class TeacherModule {}
