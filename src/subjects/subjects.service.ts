import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
  ) {}

  async create(data: any) {
    const newSubject = this.subjectRepository.create(data);
    return await this.subjectRepository.save(newSubject);
  }

  async findAll() {
    return await this.subjectRepository.find();
  }

  async findById(id: string) {
    return await this.subjectRepository.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.subjectRepository.update(id, data);
    return await this.subjectRepository.findOne({ where: { id } });
  }

  async delete(id: string) {
    return await this.subjectRepository.delete(id);
  }
}
