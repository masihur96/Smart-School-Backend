import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';
import { Routine } from '../../general/entities/routine.entity';
import { Section } from '../../sections/entities/section.entity';

@Entity()
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  schoolId: string;

  @OneToMany(() => Section, (section) => section.classEntity)
  sections: Section[];

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Subject, (subject) => subject.classEntity)
  subjects: Subject[];

  @OneToMany(() => Routine, (routine) => routine.classEntity)
  routines: Routine[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
