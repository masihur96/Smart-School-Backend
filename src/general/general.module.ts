import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralService } from './general.service';
import { GeneralController } from './general.controller';
import { Notice } from './entities/notice.entity';
import { Routine } from './entities/routine.entity';
import { Marquee } from './entities/marquee.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notice, Routine, Subject, Marquee]),
    UsersModule,
    NotificationsModule,
  ],
  providers: [GeneralService],
  controllers: [GeneralController],
  exports: [GeneralService],
})
export class GeneralModule { }
