import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTeacherAttendanceTimeToTimestamptz1716566400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Convert 'time' column from TIME to TIMESTAMPTZ
    await queryRunner.query(`
      ALTER TABLE "teacher_attendance"
        ALTER COLUMN "time" TYPE timestamptz
          USING (CURRENT_DATE + "time")::timestamptz,
        ALTER COLUMN "start_time" TYPE timestamptz
          USING (CURRENT_DATE + "start_time")::timestamptz,
        ALTER COLUMN "end_time" TYPE timestamptz
          USING (CURRENT_DATE + "end_time")::timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "teacher_attendance"
        ALTER COLUMN "time" TYPE time USING "time"::time,
        ALTER COLUMN "start_time" TYPE time USING "start_time"::time,
        ALTER COLUMN "end_time" TYPE time USING "end_time"::time
    `);
  }
}
