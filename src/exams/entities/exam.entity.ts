import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ExamResult } from './exam-result.entity';
import { AcademicAssignment } from './academic-assignment.entity';

@Entity()
export class Exam {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  exam_name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  start_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @OneToMany(() => ExamResult, (result) => result.exam)
  results: ExamResult[];

  @OneToMany(() => AcademicAssignment, (assignment) => assignment.exam)
  assignments: AcademicAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
