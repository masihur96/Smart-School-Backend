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
import { Class } from '../../classes/entities/class.entity';
import { Routine } from '../../general/entities/routine.entity';
import { OneToMany } from 'typeorm';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  classId: string;

  @ManyToOne(() => Class, (classEntity) => classEntity.sections)
  @JoinColumn({ name: 'classId' })
  classEntity: Class;

  @OneToMany(() => Routine, (routine) => routine.sectionEntity)
  @JoinColumn({ name: 'sectionId' })
  routines: Routine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
