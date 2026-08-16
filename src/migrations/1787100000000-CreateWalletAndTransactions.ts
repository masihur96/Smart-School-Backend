import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateWalletAndTransactions1787100000000
  implements MigrationInterface
{
  name = 'CreateWalletAndTransactions1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create 'wallets' table
    await queryRunner.createTable(
      new Table({
        name: 'wallets',
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
            isUnique: true,
          },
          {
            name: 'balance',
            type: 'numeric',
            precision: 14,
            scale: 2,
            default: '0.00',
          },
          {
            name: 'currency',
            type: 'varchar',
            default: "'BDT'",
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'ACTIVE'",
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

    // Index for fast lookup by schoolId
    await queryRunner.createIndex(
      'wallets',
      new TableIndex({
        name: 'IDX_wallets_schoolId',
        columnNames: ['schoolId'],
        isUnique: true,
      }),
    );

    // 2. Create 'wallet_transactions' table
    await queryRunner.createTable(
      new Table({
        name: 'wallet_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'walletId',
            type: 'uuid',
          },
          {
            name: 'schoolId',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'varchar',
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 14,
            scale: 2,
          },
          {
            name: 'category',
            type: 'varchar',
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
            name: 'paymentMethod',
            type: 'varchar',
            default: "'CASH'",
          },
          {
            name: 'referenceNumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'transactionDate',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'performedById',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'performedByName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'attachmentUrl',
            type: 'varchar',
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

    // Indices for wallet_transactions
    await queryRunner.createIndex(
      'wallet_transactions',
      new TableIndex({
        name: 'IDX_wallet_txns_walletId',
        columnNames: ['walletId'],
      }),
    );

    await queryRunner.createIndex(
      'wallet_transactions',
      new TableIndex({
        name: 'IDX_wallet_txns_school_date',
        columnNames: ['schoolId', 'transactionDate'],
      }),
    );

    await queryRunner.createIndex(
      'wallet_transactions',
      new TableIndex({
        name: 'IDX_wallet_txns_school_type',
        columnNames: ['schoolId', 'type'],
      }),
    );

    // Foreign key to wallets table
    await queryRunner.createForeignKey(
      'wallet_transactions',
      new TableForeignKey({
        name: 'FK_wallet_txns_walletId',
        columnNames: ['walletId'],
        referencedTableName: 'wallets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'wallet_transactions',
      'FK_wallet_txns_walletId',
    );
    await queryRunner.dropTable('wallet_transactions', true);
    await queryRunner.dropTable('wallets', true);
  }
}
