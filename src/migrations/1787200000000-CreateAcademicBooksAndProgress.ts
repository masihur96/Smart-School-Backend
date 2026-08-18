import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAcademicBooksAndProgress1787200000000
  implements MigrationInterface
{
  name = 'CreateAcademicBooksAndProgress1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create academic_books table
    await queryRunner.createTable(
      new Table({
        name: 'academic_books',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'schoolId',
            type: 'uuid',
          },
          {
            name: 'classId',
            type: 'uuid',
          },
          {
            name: 'subjectId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'subject',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'author',
            type: 'varchar',
          },
          {
            name: 'edition',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'coverImageUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'pdfUrl',
            type: 'varchar',
          },
          {
            name: 'fileSize',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'totalPages',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'publishedYear',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true, // ifNotExists
    );

    // Indexes for academic_books
    await queryRunner.createIndex(
      'academic_books',
      new TableIndex({
        name: 'IDX_academic_books_school_class',
        columnNames: ['schoolId', 'classId'],
      }),
    );

    // 2. Create academic_book_reading_progress table
    await queryRunner.createTable(
      new Table({
        name: 'academic_book_reading_progress',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'bookId',
            type: 'uuid',
          },
          {
            name: 'lastPage',
            type: 'int',
            default: 1,
          },
          {
            name: 'totalPages',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'isCompleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'lastReadAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true, // ifNotExists
    );

    // Unique index for user + book progress
    await queryRunner.createIndex(
      'academic_book_reading_progress',
      new TableIndex({
        name: 'IDX_academic_book_progress_user_book',
        columnNames: ['userId', 'bookId'],
        isUnique: true,
      }),
    );

    // Foreign key from progress to academic_books
    await queryRunner.createForeignKey(
      'academic_book_reading_progress',
      new TableForeignKey({
        columnNames: ['bookId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'academic_books',
        onDelete: 'CASCADE',
      }),
    );

    // 3. Migrate any existing data from academic_ebooks table if exists
    try {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'academic_ebooks') THEN
            INSERT INTO "academic_books" ("id", "schoolId", "classId", "title", "author", "subject", "coverImageUrl", "pdfUrl", "description", "totalPages", "publishedYear", "isActive", "createdAt", "updatedAt")
            SELECT "id", "schoolId", "classId", "title", "author", "subject", "coverImageUrl", "pdfUrl", "description", "totalPages", "publishedYear", "isActive", "createdAt", "updatedAt"
            FROM "academic_ebooks"
            ON CONFLICT ("id") DO NOTHING;
          END IF;
        END $$;
      `);
    } catch (e) {
      // Ignored if table doesn't exist
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('academic_book_reading_progress', true);
    await queryRunner.dropTable('academic_books', true);
  }
}
