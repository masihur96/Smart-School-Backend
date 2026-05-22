import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MarqueeType {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

@Entity()
export class Marquee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  text: string;

  @Column({
    type: 'enum',
    enum: MarqueeType,
  })
  type: MarqueeType;

  @Column()
  schoolId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
