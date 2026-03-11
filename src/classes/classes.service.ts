import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(data: any) {
    const newClass = this.classRepository.create(data);
    return await this.classRepository.save(newClass);
  }

  async findAll() {
    return await this.classRepository.find();
  }

  async findById(id: string) {
    return await this.classRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.classRepository.update(id, data);
    return await this.classRepository.findOne({ where: { id } });
  }

  async delete(id: string) {
    return await this.classRepository.delete(id);
  }
}
