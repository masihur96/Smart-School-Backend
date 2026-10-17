import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicCalendarEvent } from './entities/academic-calendar-event.entity';
import { AcademicCalendarService } from './academic-calendar.service';
import { AcademicCalendarController } from './academic-calendar.controller';
import { User } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AcademicCalendarEvent, User, Class]),
  ],
  controllers: [AcademicCalendarController],
  providers: [AcademicCalendarService],
  exports: [AcademicCalendarService],
})
export class AcademicCalendarModule {}
