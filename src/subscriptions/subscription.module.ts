import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PricingModule } from '../pricing/pricing.module';
import { UsersModule } from '../users/users.module';

import { School } from '../schools/entities/school.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, School]),
    PricingModule,
    UsersModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
