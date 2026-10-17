import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAcademicCalendar1788000000000 implements MigrationInterface {
  name = 'CreateAcademicCalendar1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'academic_calendar_events',
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
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            default: "'EVENT'",
          },
          {
            name: 'startDate',
            type: 'timestamptz',
          },
          {
            name: 'endDate',
            type: 'timestamptz',
          },
          {
            name: 'startTime',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'endTime',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'isAllDay',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isHoliday',
            type: 'boolean',
            default: false,
          },
          {
            name: 'targetAudience',
            type: 'varchar',
            default: "'ALL'",
          },
          {
            name: 'classIds',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'attachmentUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'academicYear',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'term',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdById',
            type: 'uuid',
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
      true,
    );

    // Create Indexes
    await queryRunner.createIndex(
      'academic_calendar_events',
      new TableIndex({
        name: 'IDX_academic_calendar_school',
        columnNames: ['schoolId'],
      }),
    );

    await queryRunner.createIndex(
      'academic_calendar_events',
      new TableIndex({
        name: 'IDX_academic_calendar_school_dates',
        columnNames: ['schoolId', 'startDate', 'endDate'],
      }),
    );

    await queryRunner.createIndex(
      'academic_calendar_events',
      new TableIndex({
        name: 'IDX_academic_calendar_school_category',
        columnNames: ['schoolId', 'category'],
      }),
    );

    await queryRunner.createIndex(
      'academic_calendar_events',
      new TableIndex({
        name: 'IDX_academic_calendar_school_year',
        columnNames: ['schoolId', 'academicYear'],
      }),
    );

    await queryRunner.createIndex(
      'academic_calendar_events',
      new TableIndex({
        name: 'IDX_academic_calendar_school_holiday',
        columnNames: ['schoolId', 'isHoliday'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('academic_calendar_events', true);
  }
}
