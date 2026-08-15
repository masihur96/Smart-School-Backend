import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('academic_ebooks')
export class AcademicEbook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  schoolId: string;

  @Column('uuid')
  classId: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column()
  pdfUrl: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'int' })
  totalPages: number;

  @Column({ nullable: true, type: 'int' })
  publishedYear: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
