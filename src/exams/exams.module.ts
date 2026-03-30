import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { Exam } from './entities/exam.entity';
import { ExamResult } from './entities/exam-result.entity';
import { AcademicAssignment } from './entities/academic-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, ExamResult, AcademicAssignment])],
  providers: [ExamsService],
  controllers: [ExamsController],
  exports: [ExamsService],
})
export class ExamsModule {}
