import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { Exam } from './entities/exam.entity';
import { AcademicAssignment } from './entities/academic-assignment.entity';
import { Class } from '../classes/entities/class.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../users/entities/user.entity';
import { MarksModule } from '../marks/marks.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Exam,
      AcademicAssignment,
      Class,
      Subject,
      User,
    ]),
    MarksModule,

  ],
  providers: [ExamsService],
  controllers: [ExamsController],
  exports: [ExamsService],
})
export class ExamsModule {}
