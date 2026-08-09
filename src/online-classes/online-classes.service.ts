import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnlineClass } from './entities/online-class.entity';
import { CreateOnlineClassDto } from './dto/create-online-class.dto';
import { UpdateOnlineClassDto } from './dto/update-online-class.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class OnlineClassesService {
  constructor(
    @InjectRepository(OnlineClass)
    private readonly onlineClassRepository: Repository<OnlineClass>,
  ) {}

  async create(createOnlineClassDto: CreateOnlineClassDto, user: any): Promise<OnlineClass> {
    const newClass = this.onlineClassRepository.create({
      ...createOnlineClassDto,
      hostId: user.id,
      schoolId: user.schoolId,
    });
    return await this.onlineClassRepository.save(newClass);
  }

  async findAll(user: any): Promise<OnlineClass[]> {
    if (user.role === UserRole.STUDENT) {
      if (!user.classIds || user.classIds.length === 0) {
        return [];
      }
      const query = this.onlineClassRepository.createQueryBuilder('onlineClass')
        .where('onlineClass.schoolId = :schoolId', { schoolId: user.schoolId })
        .andWhere('onlineClass.classId IN (:...classIds)', { classIds: user.classIds });

      if (user.sectionIds && user.sectionIds.length > 0) {
        query.andWhere('(onlineClass.sectionId IS NULL OR onlineClass.sectionId IN (:...sectionIds))', { sectionIds: user.sectionIds });
      }

      return await query.getMany();
    } else if (user.role === UserRole.TEACHER) {
      return await this.onlineClassRepository.find({
        where: { hostId: user.id, schoolId: user.schoolId },
      });
    } else if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return await this.onlineClassRepository.find({
        where: { schoolId: user.schoolId },
      });
    }

    return [];
  }

  async findOne(id: string, user: any): Promise<OnlineClass> {
    const onlineClass = await this.onlineClassRepository.findOne({ where: { id, schoolId: user.schoolId } });
    if (!onlineClass) {
      throw new NotFoundException('Online class not found');
    }
    return onlineClass;
  }

  async update(id: string, updateOnlineClassDto: UpdateOnlineClassDto, user: any): Promise<OnlineClass> {
    const onlineClass = await this.findOne(id, user);
    Object.assign(onlineClass, updateOnlineClassDto);
    return await this.onlineClassRepository.save(onlineClass);
  }

  async remove(id: string, user: any): Promise<void> {
    const onlineClass = await this.findOne(id, user);
    await this.onlineClassRepository.remove(onlineClass);
  }
}
