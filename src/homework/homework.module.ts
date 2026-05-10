import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeworkService } from './homework.service';
import { HomeworkController } from './homework.controller';
import { Homework } from './entities/homework.entity';
import { StudentHomework } from './entities/student-homework.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubjectsModule } from '../subjects/subjects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Homework, StudentHomework]),
    UsersModule,
    NotificationsModule,
    SubjectsModule,
  ],
  providers: [HomeworkService],
  controllers: [HomeworkController],
  exports: [HomeworkService],
})
export class HomeworkModule {}
