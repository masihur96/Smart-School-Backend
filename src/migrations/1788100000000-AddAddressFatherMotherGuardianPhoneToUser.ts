import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAddressFatherMotherGuardianPhoneToUser1788100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "address" VARCHAR DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "fatherName" VARCHAR DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "motherName" VARCHAR DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "guardianPhone" VARCHAR DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "address",
      DROP COLUMN IF EXISTS "fatherName",
      DROP COLUMN IF EXISTS "motherName",
      DROP COLUMN IF EXISTS "guardianPhone"
    `);
  }
}
