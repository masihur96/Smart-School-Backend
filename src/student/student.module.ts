import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { AttendanceModule } from '../attendance/attendance.module';
import { GeneralModule } from '../general/general.module';
import { HomeworkModule } from '../homework/homework.module';
import { MarksModule } from '../marks/marks.module';

@Module({
  imports: [
    AttendanceModule, 
    GeneralModule, 
    HomeworkModule, 
    MarksModule
  ],
  providers: [StudentService],
  controllers: [StudentController],
  exports: [StudentService],
})
export class StudentModule {}
