import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { User } from '../users/entities/user.entity';
import { School } from '../schools/entities/school.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PricingPlan } from '../pricing/entities/pricing-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, School, Subscription, PricingPlan]),
  ],
  controllers: [SuperadminController],
  providers: [SuperadminService],
  exports: [SuperadminService],
})
export class SuperadminModule {}
