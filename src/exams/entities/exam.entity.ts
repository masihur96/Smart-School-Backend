import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ExamResult } from '../../exams/entities/exam-result.entity';

@Entity()
export class Exam {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  exam_name: string;

  @Column()
  class_uid: string;

  @Column()
  subject_uid: string;

  @Column()
  examiner_uid: string;

  @Column({ type: 'date' })
  date: string;

  @OneToMany(() => ExamResult, (result) => result.exam)
  results: ExamResult[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
