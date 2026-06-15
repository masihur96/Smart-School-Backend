import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserClassSectionArrays1750034400000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new TEXT columns for classIds and sectionIds
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "classIds" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "sectionIds" text`,
    );

    // 2. Migrate existing data: wrap the old single value into a JSON array
    //    If classId was NULL, store '[]'; otherwise store '["<uuid>"]'
    await queryRunner.query(`
      UPDATE "user"
      SET "classIds" = CASE
        WHEN "classId" IS NOT NULL AND "classId" <> ''
          THEN '["' || "classId" || '"]'
        ELSE '[]'
      END
    `);

    await queryRunner.query(`
      UPDATE "user"
      SET "sectionIds" = CASE
        WHEN "sectionId" IS NOT NULL AND "sectionId" <> ''
          THEN '["' || "sectionId" || '"]'
        ELSE '[]'
      END
    `);

    // 3. Drop the old single-value columns
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "classId"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "sectionId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Re-add the old columns
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "classId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "sectionId" character varying`,
    );

    // 2. Restore first element of the array back into the old column
    await queryRunner.query(`
      UPDATE "user"
      SET "classId" = CASE
        WHEN "classIds" IS NOT NULL AND "classIds" <> '[]'
          THEN trim(both '"' FROM (("classIds"::jsonb)->0)::text)
        ELSE NULL
      END
    `);

    await queryRunner.query(`
      UPDATE "user"
      SET "sectionId" = CASE
        WHEN "sectionIds" IS NOT NULL AND "sectionIds" <> '[]'
          THEN trim(both '"' FROM (("sectionIds"::jsonb)->0)::text)
        ELSE NULL
      END
    `);

    // 3. Drop the new columns
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "classIds"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "sectionIds"`);
  }
}
