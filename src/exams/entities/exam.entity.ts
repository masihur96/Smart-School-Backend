import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Marks } from '../../marks/entities/marks.entity';
import { AcademicAssignment } from './academic-assignment.entity';

@Entity()
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  exam_name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'timestamptz', nullable: true })
  start_date: string;

  @Column({ type: 'timestamptz', nullable: true })
  end_date: string;

  @Column({ default: false })
  isPublished: boolean;

  @OneToMany(() => Marks, (result) => result.exam, { cascade: true })
  results: Marks[];

  @OneToMany(() => AcademicAssignment, (assignment) => assignment.exam, {
    cascade: true,
  })
  assignments: AcademicAssignment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
