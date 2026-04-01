import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AdminAttendanceController } from './admin-attendance.controller';
import { Attendance } from './entities/attendance.entity';
import { UsersModule } from '../users/users.module';
import { ClassesModule } from '../classes/classes.module';
import { SectionsModule } from '../sections/sections.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
    UsersModule,
    ClassesModule,
    SectionsModule,
  ],
  providers: [AttendanceService],
  controllers: [AttendanceController, AdminAttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}
