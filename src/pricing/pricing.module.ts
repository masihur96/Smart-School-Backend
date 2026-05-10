import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingPlan } from './entities/pricing-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PricingPlan])],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
