import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { CreateClassDto, UpdateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(data: CreateClassDto) {
    const newClass = this.classRepository.create(data);
    return await this.classRepository.save(newClass);
  }

  async findAll(schoolId?: string | null) {
    if (schoolId) {
      return await this.classRepository.find({ where: { schoolId } });
    }
    return await this.classRepository.find();
  }

  async findById(id: string) {
    return await this.classRepository.findOne({ where: { id } });
  }

  async update(id: string, data: UpdateClassDto) {
    await this.classRepository.update(id, data);
    return await this.classRepository.findOne({ where: { id } });
  }

  async delete(id: string) {
    return await this.classRepository.softDelete(id);
  }

  async findAllDeleted() {
    return await this.classRepository
      .createQueryBuilder('class')
      .withDeleted()
      .where('class.deletedAt IS NOT NULL')
      .orderBy('class.deletedAt', 'DESC')
      .getMany();
  }

  async restore(id: string) {
    const result = await this.classRepository.restore(id);
    if (!result.affected) {
      throw new Error(`Class ${id} not found or not deleted`);
    }
    return await this.classRepository.findOne({ where: { id } });
  }
}
