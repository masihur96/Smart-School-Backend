import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';
import { Routine } from '../../general/entities/routine.entity';

@Entity()
export class Class {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  section: string;

  @Column({ nullable: true })
  schoolId: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Subject, (subject) => subject.classEntity)
  subjects: Subject[];

  @OneToMany(() => Routine, (routine) => routine.classEntity)
  routines: Routine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
