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
export class ExamResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  examId: string;

  @Column()
  studentId: string;

  @Column()
  subjectId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  marksObtained: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  totalMarks: number;

  @Column({ nullable: true })
  remarks: string;

  @ManyToOne(() => Exam, (exam) => exam.results)
  exam: Exam;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
