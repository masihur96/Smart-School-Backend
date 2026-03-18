import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(data: any) {
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

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async findAll(role?: UserRole, page: number = 1, limit: number = 20, isActive?: boolean) {
    const query = this.userRepository.createQueryBuilder('user');
    
    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive });
    }
    
    const total = await query.getCount();
    const data = await query.skip((page - 1) * limit).take(limit).getMany();
    
    return { total, page, limit, data };
  }

  async update(id: string, data: any) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;
    
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    await this.userRepository.update(id, data);
    return await this.userRepository.findOne({ where: { id } });
  }

  async delete(id: string) {
    return await this.userRepository.delete(id);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
