import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingPlan } from './entities/pricing-plan.entity';
import {
  CreatePricingPlanDto,
  UpdatePricingPlanDto,
} from './dto/pricing-plan.dto';

@Injectable()
export class PricingService {
  private readonly setupFee = 1000;
  private readonly trialDays = 7;

  constructor(
    @InjectRepository(PricingPlan)
    private readonly pricingRepository: Repository<PricingPlan>,
  ) {}

  async create(createConfigDto: CreatePricingPlanDto) {
    const plan = this.pricingRepository.create(createConfigDto);
    return await this.pricingRepository.save(plan);
  }

  async getPlans() {
    return await this.pricingRepository.find({
      order: {
        pricePerMonth: 'ASC',
      },
    });
  }

  async findOne(id: string) {
    const plan = await this.pricingRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Pricing Plan ${id} not found`);
    return plan;
  }

  async update(id: string, updateConfigDto: UpdatePricingPlanDto) {
    await this.pricingRepository.update(id, updateConfigDto);
    return this.findOne(id);
  }

  async delete(id: string) {
    return await this.pricingRepository.softDelete(id);
  }

  async findAllDeleted() {
    return await this.pricingRepository
      .createQueryBuilder('plan')
      .withDeleted()
      .where('plan.deletedAt IS NOT NULL')
      .orderBy('plan.deletedAt', 'DESC')
      .getMany();
  }

  async restore(id: string) {
    const result = await this.pricingRepository.restore(id);
    if (!result.affected) {
      throw new NotFoundException(
        `Pricing plan ${id} not found or not deleted`,
      );
    }
    return this.findOne(id);
  }

  getDetails() {
    return {
      setupFee: this.setupFee,
      setupFeeFrequency: 'per year',
      trialDays: this.trialDays,
      marketingLines: ['Free 7-day trial', 'Setup Fee: ৳1,000 /per year'],
    };
  }

  async calculatePrice(studentCount: number) {
    if (studentCount <= 0) return null;

    if (studentCount > 1000) {
      const enterprise = await this.pricingRepository.findOne({
        where: { name: 'Enterprise' },
      });
      return {
        plan: enterprise,
        estimatedMonthlyCost: 'Contact Sales',
      };
    }

    const plans = await this.getPlans();

    // Sort logic to properly match tiers based on maxStudents
    const sortedPlans = plans
      .filter((p) => !p.isCustom && p.maxStudents !== null)
      .sort((a, b) => a.maxStudents - b.maxStudents);

    const matchedPlan = sortedPlans.find(
      (plan) => studentCount <= plan.maxStudents,
    );

    if (!matchedPlan) return null;

    return {
      plan: matchedPlan,
      estimatedMonthlyCost: matchedPlan.pricePerMonth,
      effectivePerStudentRate: matchedPlan.pricePerStudent,
    };
  }
}
