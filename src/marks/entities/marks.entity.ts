import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exam } from '../../exams/entities/exam.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Marks {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  examId: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  marksObtained: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  totalMarks: number;

  @Column({ type: 'uuid' })
  subjectId: string;

  @Column({ type: 'uuid' })
  teacherId: string;

  @Column()
  schoolId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;

  @ManyToOne(() => Exam)
  @JoinColumn({ name: 'examId' })
  exam: Exam;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacherId' })
  teacher: User;
}
