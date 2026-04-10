import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { School } from '../schools/entities/school.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PricingPlan } from '../pricing/entities/pricing-plan.entity';
import { CreateSchoolDto, UpdateSchoolDto } from '../schools/dto/create-school.dto';

@Injectable()
export class SuperadminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(PricingPlan)
    private readonly pricingRepository: Repository<PricingPlan>,
  ) {}

  // ─── Dashboard Stats ───────────────────────────────────────────
  async getDashboardStats() {
    const totalSchools = await this.schoolRepository.count();
    const totalStudents = await this.userRepository.count({ where: { role: 'student' as any } });
    const totalTeachers = await this.userRepository.count({ where: { role: 'teacher' as any } });
    const activeSubscriptions = await this.subscriptionRepository.count({ where: { isActive: true } });

    return {
      totalSchools,
      totalStudents,
      totalTeachers,
      activeSubscriptions,
    };
  }

  // ─── School Management ─────────────────────────────────────────
  async createSchool(dto: CreateSchoolDto) {
    const school = this.schoolRepository.create(dto);
    return await this.schoolRepository.save(school);
  }

  async getAllSchools() {
    return await this.schoolRepository.find();
  }

  async updateSchool(id: string, dto: UpdateSchoolDto) {
    const school = await this.schoolRepository.preload({
      id,
      ...dto,
    });
    if (!school) throw new NotFoundException(`School with ID ${id} not found`);
    return await this.schoolRepository.save(school);
  }

  // ─── User Management ───────────────────────────────────────────
  async getAllUsers(page: number = 1, limit: number = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      users,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // ─── Subscription Management ───────────────────────────────────
  async getAllSubscriptions() {
    return await this.subscriptionRepository.find({
      relations: ['pricingPlan'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateSubscriptionStatus(id: string, isActive: boolean) {
    const subscription = await this.subscriptionRepository.findOne({ where: { id } });
    if (!subscription) throw new NotFoundException(`Subscription with ID ${id} not found`);
    subscription.isActive = isActive;
    return await this.subscriptionRepository.save(subscription);
  }
}
