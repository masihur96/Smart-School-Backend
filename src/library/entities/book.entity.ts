import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('library_books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  schoolId: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ nullable: true })
  isbn: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
