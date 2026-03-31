import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Marks {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  examId: string;

  @Column()
  studentId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  marksObtained: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  totalMarks: number;

  @Column()
  subjectId: string;

  @Column()
  teacherId: string;

  @Column()
  schoolId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
