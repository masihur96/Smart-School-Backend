import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Book } from './book.entity';

@Entity('issued_book')
export class IssuedBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  schoolId: string;

  @Column('uuid')
  bookId: string;

  // Relation used only for eager loading (no FK constraint on schoolId/studentId)
  @ManyToOne(() => Book, { eager: false, nullable: true })
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @Column('uuid')
  studentId: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  issueDate: Date;

  @Column({ type: 'timestamptz' })
  dueDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  returnDate: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
