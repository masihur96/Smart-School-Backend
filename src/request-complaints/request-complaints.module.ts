import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestComplaint } from './entities/request-complaint.entity';
import { RequestComplaintComment } from './entities/request-complaint-comment.entity';
import { RequestComplaintsService } from './request-complaints.service';
import { RequestComplaintsController } from './request-complaints.controller';
import { User } from '../users/entities/user.entity';
import { Routine } from '../general/entities/routine.entity';
import { Class } from '../classes/entities/class.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequestComplaint,
      RequestComplaintComment,
      User,
      Routine,
      Class,
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [RequestComplaintsController],
  providers: [RequestComplaintsService],
  exports: [RequestComplaintsService],
})
export class RequestComplaintsModule {}
