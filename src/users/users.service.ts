import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async create(data: Partial<User>) {
    const { password, ...rest } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      ...rest,
      password: hashedPassword,
    });
    return await this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findByEmailOrPhone(identifier: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (!ids || ids.length === 0) return [];
    return await this.userRepository.find({
      where: { id: In(ids) },
    });
  }

  async findAll(
    role?: UserRole,
    page: number = 1,
    limit: number = 20,
    isActive?: boolean,
    search?: string,
    classId?: string,
    sectionId?: string,
  ) {
    const query = this.userRepository.createQueryBuilder('user');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive });
    }

    if (search) {
      query.andWhere(
        '(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    if (classId) {
      query.andWhere('user.classId = :classId', { classId });
    }

    if (sectionId) {
      query.andWhere('user.sectionId = :sectionId', { sectionId });
    }

    const total = await query.getCount();
    const data = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { total, page, limit, data };
  }

  async update(id: string, data: Partial<User>) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    await this.userRepository.update(id, data);
    return await this.userRepository.findOne({ where: { id } });
  }

  async delete(id: string) {
    return await this.userRepository.softDelete(id);
  }

  async findAllDeleted(page: number = 1, limit: number = 20) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.deletedAt IS NOT NULL')
      .orderBy('user.deletedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { total, page, limit, data };
  }

  async restore(id: string) {
    const result = await this.userRepository.restore(id);
    if (!result.affected) {
      throw new Error(`User ${id} not found or not deleted`);
    }
    return await this.userRepository.findOne({ where: { id } });
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async findStudentsByClass(classId: string, sectionId?: string) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.STUDENT })
      .andWhere('user.classId = :classId', { classId });

    if (sectionId) {
      query.andWhere('user.sectionId = :sectionId', { sectionId });
    }

    return await query.getMany();
  }

  async countStudentsBySchool(schoolId: string): Promise<number> {
    return await this.userRepository.count({
      where: {
        schoolId,
        role: UserRole.STUDENT,
      },
    });
  }
}
