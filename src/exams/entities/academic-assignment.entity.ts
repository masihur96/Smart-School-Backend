import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Exam } from './exam.entity';

@Entity()
export class AcademicAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  examId: string;

  @Column()
  class_uid: string;

  @Column()
  subject_uid: string;

  @Column()
  examiner_uid: string;

  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => Exam, (exam) => exam.assignments, { onDelete: 'CASCADE' })
  exam: Exam;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
