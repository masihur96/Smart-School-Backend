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
import { Attendance } from './attendance/entities/attendance.entity';
import { Marks } from './marks/entities/marks.entity';
import { Homework } from './homework/entities/homework.entity';
import { Notice } from './general/entities/notice.entity';
import { Routine } from './general/entities/routine.entity';
import { Section } from './sections/entities/section.entity';
import { PricingPlan } from './pricing/entities/pricing-plan.entity';
import { Subscription } from './subscriptions/entities/subscription.entity';
import { School } from './schools/entities/school.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PeriodAttendance } from './attendance/entities/period-attendance.entity';
import { TeacherAttendance } from './attendance/entities/teacher-attendance.entity';
import { SuperadminModule } from './superadmin/superadmin.module';
import { PerformanceModule } from './performance/performance.module';
import { AlterTeacherAttendanceTimeToTimestamptz1716566400000 } from './migrations/1716566400000-AlterTeacherAttendanceTimeToTimestamptz';
import { UserClassSectionArrays1750034400000 } from './migrations/1750034400000-UserClassSectionArrays';
import { AddAvatarFields1780424444421 } from './migrations/1780424444421-AddAvatarFields';
import { CreateOnlineClass1786645976995 } from './migrations/1786645976995-CreateOnlineClass';
import { LibraryModule1786651726156 } from './migrations/1786651726156-LibraryModule';
import { CleanupLibrary1786900000000 } from './migrations/1786900000000-CleanupLibrary';
import { DropLibraryBooksFk1786901000000 } from './migrations/1786901000000-DropLibraryBooksFk';
import { CreateIssuedBook1786902000000 } from './migrations/1786902000000-CreateIssuedBook';
import { SmsModule } from './sms/sms.module';
import { OnlineClassesModule } from './online-classes/online-classes.module';
import { OnlineClass } from './online-classes/entities/online-class.entity';
import { LibraryModule } from './library/library.module';
import { Book } from './library/entities/book.entity';
import { IssuedBook } from './library/entities/issued-book.entity';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // ✅ use full connection string
      extra: { options: '-c timezone=UTC' }, // ✅ Store and retrieve all timestamps in UTC



      // host: process.env.DB_HOST,
      // port: parseInt(process.env.DB_PORT, 10),
      // username: process.env.DB_USERNAME,
      // password: process.env.DB_PASSWORD,
      // database: process.env.DB_NAME,
      entities: [
        User,
        Class,
        Section,
        Subject,
        Exam,
        Attendance,
        Marks,
        Homework,
        Notice,
        Routine,
        PricingPlan,
        Subscription,
        School,
        PeriodAttendance,
        TeacherAttendance,
        OnlineClass,
        Book,
        IssuedBook,
      ],
      migrations: [
        AlterTeacherAttendanceTimeToTimestamptz1716566400000,
        UserClassSectionArrays1750034400000,
        AddAvatarFields1780424444421,
        CreateOnlineClass1786645976995,
        LibraryModule1786651726156,
        CleanupLibrary1786900000000,
        DropLibraryBooksFk1786901000000,
        CreateIssuedBook1786902000000,
      ],
      autoLoadEntities: true,
      synchronize: false,
      migrationsRun: true,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      logging: true,
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
    SuperadminModule,
    NotificationsModule,
    DashboardModule,
    PerformanceModule,
    SmsModule,
    OnlineClassesModule,
    LibraryModule,
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
