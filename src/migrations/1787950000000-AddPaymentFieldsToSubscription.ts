import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentFieldsToSubscription1787950000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "paymentMethod"  VARCHAR             DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "transactionId"  VARCHAR             DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS "amount"         DECIMAL(10, 2)      DEFAULT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_subscriptions_transactionId"
      ON "subscriptions" ("transactionId")
      WHERE "transactionId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_subscriptions_transactionId"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP COLUMN IF EXISTS "paymentMethod",
      DROP COLUMN IF EXISTS "transactionId",
      DROP COLUMN IF EXISTS "amount"
    `);
  }
}
