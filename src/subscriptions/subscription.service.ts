import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { QuerySubscriptionHistoryDto } from './dto/query-subscription-history.dto';
import { PricingService } from '../pricing/pricing.service';
import { UsersService } from '../users/users.service';
import { School } from '../schools/entities/school.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    private readonly pricingService: PricingService,
    private readonly usersService: UsersService,
  ) {}

  async assignPlan(dto: AssignSubscriptionDto) {
    const {
      schoolId,
      pricingPlanId,
      startDate,
      endDate,
      isActive,
      paymentMethod,
      transactionId,
      amount,
    } = dto;

    // 1. Verify Plan exists
    const plan = await this.pricingService.findOne(pricingPlanId);
    if (!plan) throw new NotFoundException('Pricing Plan not found');

    // 2. Count current students for this school
    const currentStudents =
      await this.usersService.countStudentsBySchool(schoolId);

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
      paymentMethod,
      transactionId,
      amount,
    });

    return await this.subscriptionRepository.save(subscription);
  }

  async getActiveSubscription(schoolId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { schoolId, isActive: true },
      relations: ['pricingPlan', 'school'],
    });

    if (!subscription) {
      throw new NotFoundException(
        `No active subscription found for school ${schoolId}`,
      );
    }

    return subscription;
  }

  async getAllSchoolSubscriptions() {
    return await this.subscriptionRepository.find({
      relations: ['pricingPlan', 'school'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateDto: UpdateSubscriptionDto) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    if (updateDto.pricingPlanId) {
      const plan = await this.pricingService.findOne(updateDto.pricingPlanId);
      if (!plan) throw new NotFoundException('Pricing Plan not found');
      subscription.pricingPlan = plan;
    }

    if (updateDto.schoolId) {
      subscription.schoolId = updateDto.schoolId;
    }

    if (updateDto.startDate !== undefined)
      subscription.startDate = updateDto.startDate;
    if (updateDto.endDate !== undefined)
      subscription.endDate = updateDto.endDate;
    if (updateDto.isActive !== undefined)
      subscription.isActive = updateDto.isActive;

    return await this.subscriptionRepository.save(subscription);
  }

  async remove(id: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return await this.subscriptionRepository.softRemove(subscription);
  }

  async findAllDeleted() {
    return await this.subscriptionRepository
      .createQueryBuilder('sub')
      .withDeleted()
      .where('sub.deletedAt IS NOT NULL')
      .leftJoinAndSelect('sub.pricingPlan', 'pricingPlan')
      .leftJoinAndSelect('sub.school', 'school')
      .orderBy('sub.deletedAt', 'DESC')
      .getMany();
  }

  async restore(id: string) {
    const result = await this.subscriptionRepository.restore(id);
    if (!result.affected) {
      throw new NotFoundException(
        `Subscription ${id} not found or not deleted`,
      );
    }
    return await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['pricingPlan', 'school'],
    });
  }

  /**
   * Get subscription history for a school (or all schools if schoolId is not provided)
   * with pagination, status calculation, search, and summary.
   */
  async getSchoolSubscriptionHistory(
    schoolId?: string,
    query: QuerySubscriptionHistoryDto = {},
  ) {
    const qb = this.subscriptionRepository
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.pricingPlan', 'pricingPlan')
      .leftJoinAndSelect('sub.school', 'school');

    if (schoolId) {
      qb.andWhere('sub.schoolId = :schoolId', { schoolId });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('sub.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.search && query.search.trim()) {
      const searchTerm = `%${query.search.trim()}%`;
      qb.andWhere(
        '(pricingPlan.name ILIKE :search OR sub.transactionId ILIKE :search OR sub.paymentMethod ILIKE :search OR sub.schoolId ILIKE :search)',
        { search: searchTerm },
      );
    }

    // Sort order
    const validSortFields: Record<string, string> = {
      createdAt: 'sub.createdAt',
      startDate: 'sub.startDate',
      endDate: 'sub.endDate',
      amount: 'sub.amount',
    };
    const sortField = validSortFields[query.sortBy || ''] || 'sub.createdAt';
    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(sortField, sortOrder);

    // Pagination
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    qb.skip((page - 1) * limit).take(limit);

    const [subscriptions, total] = await qb.getManyAndCount();

    // Find current active subscription for the school (if schoolId is provided)
    let activeSubscription: Subscription | null = null;
    if (schoolId) {
      activeSubscription = await this.subscriptionRepository.findOne({
        where: { schoolId, isActive: true },
        relations: ['pricingPlan', 'school'],
      });
    }

    // School info
    let schoolInfo: School | null = null;
    if (schoolId) {
      schoolInfo = await this.schoolRepository.findOne({
        where: { schoolId },
      });
    }

    // Total amount paid
    let totalAmountPaid = 0;
    if (schoolId) {
      const sumResult = await this.subscriptionRepository
        .createQueryBuilder('sub')
        .select('SUM(sub.amount)', 'total')
        .where('sub.schoolId = :schoolId', { schoolId })
        .getRawOne();
      totalAmountPaid = parseFloat(sumResult?.total) || 0;
    } else {
      const sumResult = await this.subscriptionRepository
        .createQueryBuilder('sub')
        .select('SUM(sub.amount)', 'total')
        .getRawOne();
      totalAmountPaid = parseFloat(sumResult?.total) || 0;
    }

    // Enrich items with computed status and days remaining
    const now = new Date();
    const enriched = subscriptions.map((sub) => {
      let status: 'active' | 'expired' | 'upcoming' | 'inactive' = 'inactive';
      let daysRemaining: number | null = null;

      if (sub.endDate) {
        const end = new Date(sub.endDate);
        const diffTime = end.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const isExpired = sub.endDate ? new Date(sub.endDate) < now : false;

      if (sub.isActive) {
        if (isExpired) {
          status = 'expired';
        } else if (sub.startDate && new Date(sub.startDate) > now) {
          status = 'upcoming';
        } else {
          status = 'active';
        }
      } else {
        if (isExpired) {
          status = 'expired';
        } else {
          status = 'inactive';
        }
      }

      return {
        ...sub,
        status,
        daysRemaining:
          daysRemaining !== null && daysRemaining > 0 ? daysRemaining : 0,
        isExpired,
      };
    });

    return {
      schoolId: schoolId || null,
      school: schoolInfo,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      activeSubscription: activeSubscription
        ? {
            ...activeSubscription,
            status: 'active',
            daysRemaining: activeSubscription.endDate
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(activeSubscription.endDate).getTime() -
                      now.getTime()) /
                      (1000 * 60 * 60 * 24),
                  ),
                )
              : null,
          }
        : null,
      summary: {
        totalSubscriptions: total,
        hasActiveSubscription: !!activeSubscription,
        totalAmountPaid,
      },
      subscriptions: enriched,
      data: enriched,
    };
  }
}

