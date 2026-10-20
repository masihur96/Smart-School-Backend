import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateFeesManagementSystem1788400000000
  implements MigrationInterface
{
  name = 'CreateFeesManagementSystem1788400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create 'fee_structures' table
    await queryRunner.createTable(
      new Table({
        name: 'fee_structures',
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
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'feeType',
            type: 'varchar',
            default: "'TUITION'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 14,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'frequency',
            type: 'varchar',
            default: "'MONTHLY'",
          },
          {
            name: 'classIds',
            type: 'text',
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

    await queryRunner.createIndex(
      'fee_structures',
      new TableIndex({
        name: 'IDX_fee_structures_school',
        columnNames: ['schoolId'],
      }),
    );

    await queryRunner.createIndex(
      'fee_structures',
      new TableIndex({
        name: 'IDX_fee_structures_school_type',
        columnNames: ['schoolId', 'feeType'],
      }),
    );

    // 2. Create 'fee_invoices' table
    await queryRunner.createTable(
      new Table({
        name: 'fee_invoices',
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
            name: 'invoiceNumber',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'studentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'classId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'sectionId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'feeType',
            type: 'varchar',
            default: "'TUITION'",
          },
          {
            name: 'feeStructureId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'month',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'year',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'dueDate',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 14,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'discountAmount',
            type: 'numeric',
            precision: 14,
            scale: 2,
            default: '0.00',
          },
          {
            name: 'fineAmount',
            type: 'numeric',
            precision: 14,
            scale: 2,
            default: '0.00',
          },
          {
            name: 'payableAmount',
            type: 'numeric',
            precision: 14,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'paidAmount',
            type: 'numeric',
            precision: 14,
            scale: 2,
            default: '0.00',
          },
          {
            name: 'dueAmount',
            type: 'numeric',
            precision: 14,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'UNPAID'",
          },
          {
            name: 'paymentMode',
            type: 'varchar',
            default: "'PERSONAL_PAYMENT'",
          },
          {
            name: 'createdById',
            type: 'uuid',
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

    await queryRunner.createIndex(
      'fee_invoices',
      new TableIndex({
        name: 'IDX_fee_invoices_school_num',
        columnNames: ['schoolId', 'invoiceNumber'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'fee_invoices',
      new TableIndex({
        name: 'IDX_fee_invoices_student',
        columnNames: ['studentId'],
      }),
    );

    await queryRunner.createIndex(
      'fee_invoices',
      new TableIndex({
        name: 'IDX_fee_invoices_school_status',
        columnNames: ['schoolId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'fee_invoices',
      new TableIndex({
        name: 'IDX_fee_invoices_school_due',
        columnNames: ['schoolId', 'dueDate'],
      }),
    );

    await queryRunner.createIndex(
      'fee_invoices',
      new TableIndex({
        name: 'IDX_fee_invoices_school_year_month',
        columnNames: ['schoolId', 'year', 'month'],
      }),
    );

    // 3. Create 'fee_payments' table
    await queryRunner.createTable(
      new Table({
        name: 'fee_payments',
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
            name: 'invoiceId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'studentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'receiptNumber',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 14,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'paymentMode',
            type: 'varchar',
            default: "'PERSONAL_PAYMENT'",
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            default: "'CASH'",
          },
          {
            name: 'transactionId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'paymentDate',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'note',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'collectedById',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'fee_payments',
      new TableIndex({
        name: 'IDX_fee_payments_school_receipt',
        columnNames: ['schoolId', 'receiptNumber'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'fee_payments',
      new TableIndex({
        name: 'IDX_fee_payments_invoice',
        columnNames: ['invoiceId'],
      }),
    );

    await queryRunner.createIndex(
      'fee_payments',
      new TableIndex({
        name: 'IDX_fee_payments_student',
        columnNames: ['studentId'],
      }),
    );

    await queryRunner.createIndex(
      'fee_payments',
      new TableIndex({
        name: 'IDX_fee_payments_school_date',
        columnNames: ['schoolId', 'paymentDate'],
      }),
    );

    // 4. Create 'fee_settings' table
    await queryRunner.createTable(
      new Table({
        name: 'fee_settings',
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
            isUnique: true,
          },
          {
            name: 'defaultPaymentMode',
            type: 'varchar',
            default: "'PERSONAL_PAYMENT'",
          },
          {
            name: 'personalPaymentInfo',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'schoolCarePaymentInfo',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'lateFeeFinePerDay',
            type: 'numeric',
            precision: 10,
            scale: 2,
            default: '0.00',
          },
          {
            name: 'currency',
            type: 'varchar',
            default: "'BDT'",
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

    await queryRunner.createIndex(
      'fee_settings',
      new TableIndex({
        name: 'IDX_fee_settings_school',
        columnNames: ['schoolId'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('fee_settings', true);
    await queryRunner.dropTable('fee_payments', true);
    await queryRunner.dropTable('fee_invoices', true);
    await queryRunner.dropTable('fee_structures', true);
  }
}
