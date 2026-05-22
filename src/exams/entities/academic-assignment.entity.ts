import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
} from 'typeorm';
import { Exam } from './exam.entity';

@Entity()
export class AcademicAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  examId: string;

  @Column({ type: 'jsonb', nullable: true })
  class: { uuid: string; name: string };

  @Column({ type: 'jsonb', nullable: true })
  subject: { uuid: string; name: string };

  @Column({ type: 'jsonb', nullable: true })
  examiner: { uuid: string; name: string };

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text', nullable: true })
  syllabus: string;

  @ManyToOne(() => Exam, (exam) => exam.assignments, { onDelete: 'CASCADE' })
  exam: Exam;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
