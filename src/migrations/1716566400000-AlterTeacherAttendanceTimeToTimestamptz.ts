import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTeacherAttendanceTimeToTimestamptz1716566400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check actual column names (TypeORM uses camelCase: startTime, endTime)
    // and only alter columns that exist and are not already timestamptz.

    const columnsToCheck: { column: string; fallback: string }[] = [
      { column: 'time', fallback: 'time' },
      { column: 'startTime', fallback: 'start_time' },
      { column: 'endTime', fallback: 'end_time' },
    ];

    for (const { column } of columnsToCheck) {
      const result = await queryRunner.query(
        `
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'teacher_attendance'
          AND column_name = $1
        `,
        [column],
      );

      if (result.length === 0) {
        // Column does not exist — skip
        continue;
      }

      const dataType: string = result[0].data_type;
      if (
        dataType === 'timestamp with time zone' ||
        dataType === 'timestamptz'
      ) {
        // Already the target type — skip
        continue;
      }

      await queryRunner.query(
        `ALTER TABLE "teacher_attendance"
           ALTER COLUMN "${column}" TYPE timestamptz
             USING (CURRENT_DATE + "${column}")::timestamptz`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columns = ['time', 'startTime', 'endTime'];

    for (const column of columns) {
      const result = await queryRunner.query(
        `
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'teacher_attendance'
          AND column_name = $1
        `,
        [column],
      );

      if (result.length === 0) continue;

      const dataType: string = result[0].data_type;
      if (dataType === 'time without time zone' || dataType === 'time') {
        continue;
      }

      await queryRunner.query(
        `ALTER TABLE "teacher_attendance"
           ALTER COLUMN "${column}" TYPE time
             USING "${column}"::time`,
      );
    }
  }
}

