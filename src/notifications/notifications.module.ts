import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { FirebaseProvider } from '../firebase.provider';
import { Notification } from './entities/notification.entity';
import { FcmToken } from './entities/fcm-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, FcmToken])],
  controllers: [NotificationsController],
  providers: [NotificationsService, FirebaseProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}