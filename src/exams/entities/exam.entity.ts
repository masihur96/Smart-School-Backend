import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ExamResult } from '../../exams/entities/exam-result.entity';

@Entity()
export class Exam {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  classId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  schoolId: string;

  @OneToMany(() => ExamResult, (result) => result.exam)
  results: ExamResult[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
