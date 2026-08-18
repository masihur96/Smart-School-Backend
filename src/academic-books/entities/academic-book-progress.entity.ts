import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AcademicBook } from './academic-book.entity';

@Entity('academic_book_reading_progress')
@Index(['userId', 'bookId'], { unique: true })
export class AcademicBookReadingProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column('uuid')
  @Index()
  bookId: string;

  @ManyToOne(() => AcademicBook, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: AcademicBook;

  @Column({ type: 'int', default: 1 })
  lastPage: number;

  @Column({ type: 'int', nullable: true })
  totalPages?: number;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastReadAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
