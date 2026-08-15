import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAcademicEbooks1787000000000 implements MigrationInterface {
  name = 'CreateAcademicEbooks1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'academic_ebooks',
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
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'author',
            type: 'varchar',
          },
          {
            name: 'subject',
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
        ],
      }),
      true, // ifNotExists
    );

    // Index for fast lookup by school + class
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_academic_ebooks_school_class" ON "academic_ebooks" ("schoolId", "classId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_academic_ebooks_school_class"`);
    await queryRunner.dropTable('academic_ebooks', true);
  }
}
