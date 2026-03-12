import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { TeacherModule } from './teacher/teacher.module';
import { StudentModule } from './student/student.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ExamsModule } from './exams/exams.module';
import { AttendanceModule } from './attendance/attendance.module';
import { MarksModule } from './marks/marks.module';
import { HomeworkModule } from './homework/homework.module';
import { GeneralModule } from './general/general.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { Class } from './classes/entities/class.entity';
import { Subject } from './subjects/entities/subject.entity';
import { Exam } from './exams/entities/exam.entity';
import { ExamResult } from './exams/entities/exam-result.entity';
import { Attendance } from './attendance/entities/attendance.entity';
import { Marks } from './marks/entities/marks.entity';
import { Homework } from './homework/entities/homework.entity';
import { Notice } from './general/entities/notice.entity';
import { Routine } from './general/entities/routine.entity';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
    }),
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Class, Subject, Exam, ExamResult, Attendance, Marks, Homework, Notice, Routine],
  autoLoadEntities: true,
  synchronize: true,
   ssl: {
    rejectUnauthorized: false,
  },
}),
    
    AuthModule,
    UsersModule,
    AdminModule,
    TeacherModule,
    StudentModule,
    ClassesModule,
    SubjectsModule,
    ExamsModule,
    AttendanceModule,
    MarksModule,
    HomeworkModule,
    GeneralModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}