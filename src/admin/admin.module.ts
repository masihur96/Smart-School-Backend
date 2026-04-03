import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { ClassesModule } from '../classes/classes.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { ExamsModule } from '../exams/exams.module';
import { MarksModule } from '../marks/marks.module';

@Module({
  imports: [UsersModule, ClassesModule, SubjectsModule, ExamsModule, MarksModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
