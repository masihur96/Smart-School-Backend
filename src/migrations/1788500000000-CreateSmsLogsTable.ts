import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateSmsLogsTable1788500000000 implements MigrationInterface {
  name = 'CreateSmsLogsTable1788500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sms_logs',
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
            isNullable: true,
          },
          {
            name: 'senderId',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'campaignName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'targetAudience',
            type: 'varchar',
            length: '50',
            default: "'DIRECT'",
          },
          {
            name: 'classId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'sectionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'recipientCount',
            type: 'int',
            default: 1,
          },
          {
            name: 'recipients',
            type: 'text',
            isArray: true,
            default: "'{}'",
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
            default: "'PENDING'",
          },
          {
            name: 'batchId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'messageId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'responseCode',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'rawResponse',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sentById',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Indices for performance
    await queryRunner.createIndex(
      'sms_logs',
      new TableIndex({
        name: 'IDX_sms_logs_schoolId',
        columnNames: ['schoolId'],
      }),
    );

    await queryRunner.createIndex(
      'sms_logs',
      new TableIndex({
        name: 'IDX_sms_logs_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'sms_logs',
      new TableIndex({
        name: 'IDX_sms_logs_batchId',
        columnNames: ['batchId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('sms_logs', 'IDX_sms_logs_batchId');
    await queryRunner.dropIndex('sms_logs', 'IDX_sms_logs_status');
    await queryRunner.dropIndex('sms_logs', 'IDX_sms_logs_schoolId');
    await queryRunner.dropTable('sms_logs');
  }
}
