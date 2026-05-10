import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { ClassesModule } from '../classes/classes.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { ExamsModule } from '../exams/exams.module';
import { MarksModule } from '../marks/marks.module';
import { HomeworkModule } from '../homework/homework.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from '../schools/entities/school.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([School]),
    UsersModule,
    ClassesModule,
    SubjectsModule,
    ExamsModule,
    MarksModule,
    HomeworkModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
