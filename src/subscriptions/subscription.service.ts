import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { PricingService } from '../pricing/pricing.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly pricingService: PricingService,
    private readonly usersService: UsersService,
  ) {}

  async assignPlan(dto: AssignSubscriptionDto) {
    const { schoolId, pricingPlanId, startDate, endDate, isActive } = dto;

    // 1. Verify Plan exists
    const plan = await this.pricingService.findOne(pricingPlanId);
    if (!plan) throw new NotFoundException('Pricing Plan not found');

    // 2. Count current students for this school
    const currentStudents = await this.usersService.countStudentsBySchool(schoolId);

    // 3. Optional: Validate if current students fit in the new plan
    if (plan.maxStudents !== null && currentStudents > plan.maxStudents) {
      throw new BadRequestException(
        `Cannot assign ${plan.name} plan. School has ${currentStudents} students, but plan limit is ${plan.maxStudents}.`,
      );
    }

    // 4. Deactivate existing active subscriptions for this school
    // Only if the new plan is intended to be active
    if (isActive !== false) {
      await this.subscriptionRepository.update(
        { schoolId, isActive: true },
        { isActive: false },
      );
    }

    // 5. Create new subscription
    const subscription = this.subscriptionRepository.create({
      schoolId,
      pricingPlan: plan,
      startDate: startDate || new Date(),
      endDate,
      isActive: isActive ?? true,
      lastStudentCount: currentStudents,
    });

    return await this.subscriptionRepository.save(subscription);
  }

  async getActiveSubscription(schoolId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { schoolId, isActive: true },
      relations: ['pricingPlan', 'school'],
    });

    if (!subscription) {
      throw new NotFoundException(`No active subscription found for school ${schoolId}`);
    }

    return subscription;
  }

  async getAllSchoolSubscriptions() {
    return await this.subscriptionRepository.find({
      relations: ['pricingPlan', 'school'],
      order: { createdAt: 'DESC' },
    });
  }
}
