import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { ExamsModule } from '../exams/exams.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { GeneralModule } from '../general/general.module';
import { HomeworkModule } from '../homework/homework.module';

@Module({
  imports: [ExamsModule, AttendanceModule, GeneralModule, HomeworkModule],
  providers: [StudentService],
  controllers: [StudentController],
  exports: [StudentService],
})
export class StudentModule {}
