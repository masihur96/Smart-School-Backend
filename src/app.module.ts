import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt/jwt.guard';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

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
import { SectionsModule } from './sections/sections.module';
import { PricingModule } from './pricing/pricing.module';
import { SubscriptionModule } from './subscriptions/subscription.module';
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
import { Section } from './sections/entities/section.entity';
import { PricingPlan } from './pricing/entities/pricing-plan.entity';
import { Subscription } from './subscriptions/entities/subscription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [
        User,
        Class,
        Section,
        Subject,
        Exam,
        ExamResult,
        Attendance,
        Marks,
        Homework,
        Notice,
        Routine,
        PricingPlan,
        Subscription,
      ],
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
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
    SectionsModule,
    PricingModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule { }
