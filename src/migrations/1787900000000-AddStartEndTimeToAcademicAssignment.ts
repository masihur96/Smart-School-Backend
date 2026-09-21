import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStartEndTimeToAcademicAssignment1787900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "academic_assignment"
      ADD COLUMN IF NOT EXISTS "start_time" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "end_time" TIMESTAMP WITH TIME ZONE DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "academic_assignment"
      DROP COLUMN IF EXISTS "start_time",
      DROP COLUMN IF EXISTS "end_time"
    `);
  }
}
