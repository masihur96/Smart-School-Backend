import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { School } from '../schools/entities/school.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PricingPlan } from '../pricing/entities/pricing-plan.entity';
import { Class } from '../classes/entities/class.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Section } from '../sections/entities/section.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
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
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(Homework)
    private readonly homeworkRepository: Repository<Homework>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
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
    const school = await this.schoolRepository.preload({ id, ...dto });
    if (!school) throw new NotFoundException(`School with ID ${id} not found`);
    return await this.schoolRepository.save(school);
  }

  async deleteSchool(id: string) {
    const result = await this.schoolRepository.softDelete(id);
    if (!result.affected) throw new NotFoundException(`School ${id} not found`);
    return { message: `School ${id} moved to trash` };
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
      relations: ['pricingPlan', 'school'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateSubscriptionStatus(id: string, isActive: boolean) {
    const subscription = await this.subscriptionRepository.findOne({ where: { id } });
    if (!subscription) throw new NotFoundException(`Subscription with ID ${id} not found`);
    subscription.isActive = isActive;
    return await this.subscriptionRepository.save(subscription);
  }

  // ─── Trash: Get All Soft-Deleted Records ───────────────────────
  async getTrash() {
    // Run queries sequentially to avoid PostgreSQL 'already executing' errors
    // and provide better stability.
    const users = await this.userRepository
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.deletedAt IS NOT NULL')
      .orderBy('user.deletedAt', 'DESC')
      .getMany();

    const schools = await this.schoolRepository
      .createQueryBuilder('school')
      .withDeleted()
      .where('school.deletedAt IS NOT NULL')
      .orderBy('school.deletedAt', 'DESC')
      .getMany();

    const classes = await this.classRepository
      .createQueryBuilder('class')
      .withDeleted()
      .where('class.deletedAt IS NOT NULL')
      .orderBy('class.deletedAt', 'DESC')
      .getMany();

    const subjects = await this.subjectRepository
      .createQueryBuilder('subject')
      .withDeleted()
      .where('subject.deletedAt IS NOT NULL')
      .orderBy('subject.deletedAt', 'DESC')
      .getMany();

    const sections = await this.sectionRepository
      .createQueryBuilder('section')
      .withDeleted()
      .where('section.deletedAt IS NOT NULL')
      .orderBy('section.deletedAt', 'DESC')
      .getMany();

    const pricingPlans = await this.pricingRepository
      .createQueryBuilder('plan')
      .withDeleted()
      .where('plan.deletedAt IS NOT NULL')
      .orderBy('plan.deletedAt', 'DESC')
      .getMany();

    const subscriptions = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .withDeleted()
      .where('sub.deletedAt IS NOT NULL')
      .leftJoinAndSelect('sub.pricingPlan', 'pricingPlan')
      .leftJoinAndSelect('sub.school', 'school')
      .orderBy('sub.deletedAt', 'DESC')
      .getMany();

    const homework = await this.homeworkRepository
      .createQueryBuilder('homework')
      .withDeleted()
      .where('homework.deletedAt IS NOT NULL')
      .orderBy('homework.deletedAt', 'DESC')
      .getMany();

    const attendance = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .withDeleted()
      .where('attendance.deletedAt IS NOT NULL')
      .orderBy('attendance.deletedAt', 'DESC')
      .getMany();

    return {
      summary: {
        users: (users || []).length,
        schools: (schools || []).length,
        classes: (classes || []).length,
        subjects: (subjects || []).length,
        sections: (sections || []).length,
        pricingPlans: (pricingPlans || []).length,
        subscriptions: (subscriptions || []).length,
        homework: (homework || []).length,
        attendance: (attendance || []).length,
        total:
          (users?.length || 0) +
          (schools?.length || 0) +
          (classes?.length || 0) +
          (subjects?.length || 0) +
          (sections?.length || 0) +
          (pricingPlans?.length || 0) +
          (subscriptions?.length || 0) +
          (homework?.length || 0) +
          (attendance?.length || 0),
      },
      users: users || [],
      schools: schools || [],
      classes: classes || [],
      subjects: subjects || [],
      sections: sections || [],
      pricingPlans: pricingPlans || [],
      subscriptions: subscriptions || [],
      homework: homework || [],
      attendance: attendance || [],
    };
  }

  // ─── Restore: Generic Dispatcher ───────────────────────────────
  async restoreEntity(entity: string, id: string) {
    const entityMap: Record<string, () => Promise<any>> = {
      user: () => this.restoreUser(id),
      school: () => this.restoreSchool(id),
      class: () => this.restoreClass(id),
      subject: () => this.restoreSubject(id),
      section: () => this.restoreSection(id),
      pricing: () => this.restorePricingPlan(id),
      subscription: () => this.restoreSubscription(id),
      homework: () => this.restoreHomework(id),
      attendance: () => this.restoreAttendance(id),
    };

    const handler = entityMap[entity.toLowerCase()];
    if (!handler) {
      throw new BadRequestException(
        `Unknown entity type "${entity}". Valid types: user, school, class, subject, section, pricing, subscription, homework, attendance`,
      );
    }
    return await handler();
  }

  // ─── Individual Restore Methods ────────────────────────────────
  async restoreUser(id: string) {
    const result = await this.userRepository.restore(id);
    if (!result.affected)
      throw new NotFoundException(`User ${id} not found in trash`);
    return await this.userRepository.findOne({ where: { id } });
  }

  async restoreSchool(id: string) {
    const result = await this.schoolRepository.restore(id);
    if (!result.affected)
      throw new NotFoundException(`School ${id} not found in trash`);
    return await this.schoolRepository.findOne({ where: { id } });
  }

  async restoreClass(id: string) {
    const result = await this.classRepository.restore(id);
    if (!result.affected)
      throw new NotFoundException(`Class ${id} not found in trash`);
    return await this.classRepository.findOne({ where: { id } });
  }

  async restoreSubject(id: string) {
    const result = await this.subjectRepository.restore(id);
    if (!result.affected)
      throw new NotFoundException(`Subject ${id} not found in trash`);
    return await this.subjectRepository.findOne({ where: { id } });
  }

  async restoreSection(id: string) {
    const result = await this.sectionRepository.restore(id);
    if (!result.affected)
      throw new NotFoundException(`Section ${id} not found in trash`);
    return await this.sectionRepository.findOne({ where: { id } });
  }

  async restorePricingPlan(id: string) {
    const result = await this.pricingRepository.restore(id);
    if (!result.affected)
      throw new NotFoundException(`Pricing plan ${id} not found in trash`);
    return await this.pricingRepository.findOne({ where: { id } });
  }

  async restoreSubscription(id: string) {
    const result = await this.subscriptionRepository.restore(id);
    if (!result.affected)
      throw new NotFoundException(`Subscription ${id} not found in trash`);
    return await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['pricingPlan', 'school'],
    });
  }

  async restoreHomework(id: string) {
    const result = await this.homeworkRepository.restore(id);
    if (!result.affected)
      throw new NotFoundException(`Homework ${id} not found in trash`);
    return await this.homeworkRepository.findOne({ where: { id } });
  }

  async restoreAttendance(id: string) {
    const result = await this.attendanceRepository.restore(id);
    if (!result.affected)
      throw new NotFoundException(`Attendance ${id} not found in trash`);
    return await this.attendanceRepository.findOne({ where: { id } });
  }
}
