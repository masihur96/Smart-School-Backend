import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { TeacherModule } from './teacher/teacher.module';
import { StudentModule } from './student/student.module';

@Module({
  imports: [AuthModule, UsersModule, AdminModule, TeacherModule, StudentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
