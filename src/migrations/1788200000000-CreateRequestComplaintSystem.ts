import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateRequestComplaintSystem1788200000000
  implements MigrationInterface
{
  name = 'CreateRequestComplaintSystem1788200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create 'request_complaints' table
    await queryRunner.createTable(
      new Table({
        name: 'request_complaints',
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
            isNullable: false,
          },
          {
            name: 'senderId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'recipientId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'targetRole',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            default: "'REQUEST'",
          },
          {
            name: 'category',
            type: 'varchar',
            default: "'OTHER'",
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'priority',
            type: 'varchar',
            default: "'MEDIUM'",
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'PENDING'",
          },
          {
            name: 'attachments',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'resolutionNote',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'resolvedById',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'resolvedAt',
            type: 'timestamptz',
            isNullable: true,
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

    // Indexes for request_complaints
    await queryRunner.createIndex(
      'request_complaints',
      new TableIndex({
        name: 'IDX_rc_school',
        columnNames: ['schoolId'],
      }),
    );

    await queryRunner.createIndex(
      'request_complaints',
      new TableIndex({
        name: 'IDX_rc_sender',
        columnNames: ['senderId'],
      }),
    );

    await queryRunner.createIndex(
      'request_complaints',
      new TableIndex({
        name: 'IDX_rc_recipient',
        columnNames: ['recipientId'],
      }),
    );

    await queryRunner.createIndex(
      'request_complaints',
      new TableIndex({
        name: 'IDX_rc_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'request_complaints',
      new TableIndex({
        name: 'IDX_rc_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'request_complaints',
      new TableIndex({
        name: 'IDX_rc_school_status',
        columnNames: ['schoolId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'request_complaints',
      new TableIndex({
        name: 'IDX_rc_school_type',
        columnNames: ['schoolId', 'type'],
      }),
    );

    await queryRunner.createIndex(
      'request_complaints',
      new TableIndex({
        name: 'IDX_rc_school_created',
        columnNames: ['schoolId', 'createdAt'],
      }),
    );

    // 2. Create 'request_complaint_comments' table
    await queryRunner.createTable(
      new Table({
        name: 'request_complaint_comments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'requestComplaintId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'senderId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'attachments',
            type: 'text',
            isNullable: true,
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
      true,
    );

    // Indexes for request_complaint_comments
    await queryRunner.createIndex(
      'request_complaint_comments',
      new TableIndex({
        name: 'IDX_rc_comment_rc_id',
        columnNames: ['requestComplaintId'],
      }),
    );

    await queryRunner.createIndex(
      'request_complaint_comments',
      new TableIndex({
        name: 'IDX_rc_comment_sender',
        columnNames: ['senderId'],
      }),
    );

    await queryRunner.createIndex(
      'request_complaint_comments',
      new TableIndex({
        name: 'IDX_rc_comment_rc_created',
        columnNames: ['requestComplaintId', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('request_complaint_comments', true);
    await queryRunner.dropTable('request_complaints', true);
  }
}
