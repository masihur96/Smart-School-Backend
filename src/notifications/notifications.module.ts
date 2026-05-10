import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { FirebaseProvider } from '../firebase.provider';
import { Notification } from './entities/notification.entity';
import { FcmToken } from './entities/fcm-token.entity';
import { UsersModule } from '../users/users.module';
import { Class } from '../classes/entities/class.entity';
import { Section } from '../sections/entities/section.entity';
import { School } from '../schools/entities/school.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, FcmToken, Class, Section, School]),
    forwardRef(() => UsersModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, FirebaseProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
