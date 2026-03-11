import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Homework } from './entities/homework.entity';

@Injectable()
export class HomeworkService {
  constructor(
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
  ) {}

  async create(data: any) {
    const homework = this.homeworkRepository.create(data);
    return await this.homeworkRepository.save(homework);
  }

  async findAll(classId?: string, subjectId?: string) {
    const query = this.homeworkRepository.createQueryBuilder('homework');
    
    if (classId) {
      query.where('homework.classId = :classId', { classId });
    }
    
    if (subjectId) {
      if (classId) {
        query.andWhere('homework.subjectId = :subjectId', { subjectId });
      } else {
        query.where('homework.subjectId = :subjectId', { subjectId });
      }
    }
    
    return await query.getMany();
  }

  async findById(id: string) {
    return await this.homeworkRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.homeworkRepository.update(id, data);
    return await this.homeworkRepository.findOne({ where: { id } });
  }

  async delete(id: string) {
    return await this.homeworkRepository.delete(id);
  }
}
