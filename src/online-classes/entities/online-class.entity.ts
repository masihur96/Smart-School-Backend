import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class OnlineClass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  meetLink: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ nullable: true })
  startTime: string;

  @Column({ nullable: true })
  endTime: string;

  @Column()
  hostId: string;

  @Column()
  schoolId: string;

  @Column({ nullable: true })
  classId: string;

  @Column({ nullable: true })
  sectionId: string;

  @Column({ nullable: true })
  subjectId: string;

  @Column('simple-array', { nullable: true })
  participantUuids: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
