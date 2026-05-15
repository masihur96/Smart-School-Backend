import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaFix1778864505000 implements MigrationInterface {
  name = 'SchemaFix1778864505000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure UUID extension is available
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 1. Period Attendance Setup
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "period_attendance_status_enum" AS ENUM ('present', 'absent', 'late', 'leave');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "period_attendance" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "routineId" UUID NOT NULL,
        "studentId" UUID NOT NULL,
        "studentName" VARCHAR,
        "classId" UUID NOT NULL,
        "sectionId" UUID,
        "subjectId" UUID,
        "teacherId" UUID,
        "date" DATE NOT NULL,
        "status" "period_attendance_status_enum" NOT NULL DEFAULT 'absent',
        "schoolId" VARCHAR,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_period_attendance" PRIMARY KEY ("id")
      );
    `);

    // 2. Homework Table Conversion (VARCHAR -> UUID)
    // We use a regex to ensure only valid UUID strings are cast. 
    // Invalid strings (like 'uuid-class-001') are converted to NULL.
    await queryRunner.query(`
      ALTER TABLE "homework" 
      ALTER COLUMN "classId" TYPE UUID USING (CASE WHEN "classId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN "classId"::UUID ELSE NULL END),
      ALTER COLUMN "subjectId" TYPE UUID USING (CASE WHEN "subjectId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN "subjectId"::UUID ELSE NULL END),
      ALTER COLUMN "teacherId" TYPE UUID USING (CASE WHEN "teacherId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN "teacherId"::UUID ELSE NULL END),
      ALTER COLUMN "sectionId" TYPE UUID USING (CASE WHEN "sectionId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN "sectionId"::UUID ELSE NULL END);
    `);

    // 3. Attendance Table Conversion (VARCHAR -> UUID)
    await queryRunner.query(`
      ALTER TABLE "attendance" 
      ALTER COLUMN "classId" TYPE UUID USING (CASE WHEN "classId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN "classId"::UUID ELSE NULL END),
      ALTER COLUMN "studentId" TYPE UUID USING (CASE WHEN "studentId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN "studentId"::UUID ELSE NULL END);
    `);

    // 4. Routine Table Fix
    // Convert all ID columns in routine to UUID to match other tables and avoid 500 errors.
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "routine" 
        ALTER COLUMN "classId" TYPE UUID USING (CASE WHEN "classId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN "classId"::UUID ELSE NULL END),
        ALTER COLUMN "subjectId" TYPE UUID USING (CASE WHEN "subjectId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN "subjectId"::UUID ELSE NULL END),
        ALTER COLUMN "teacherId" TYPE UUID USING (CASE WHEN "teacherId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN "teacherId"::UUID ELSE NULL END),
        ALTER COLUMN "sectionId" TYPE UUID USING (CASE WHEN "sectionId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN "sectionId"::UUID ELSE NULL END);
      EXCEPTION WHEN others THEN null; END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverting UUID to VARCHAR is possible but usually not needed for a fix.
    // We leave it as UUID since it's the intended final state.
  }
}
