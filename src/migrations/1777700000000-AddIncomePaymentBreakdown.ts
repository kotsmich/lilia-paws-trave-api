import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Splits an income into what is owed (`amount`) and what has arrived, by
 * method. Adds `dismissed` so a seeded adopter row can be removed from the
 * incomes list for good without deleting the requester.
 */
export class AddIncomePaymentBreakdown1777700000000 implements MigrationInterface {
  name = 'AddIncomePaymentBreakdown1777700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
        ADD COLUMN "paidCash" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN "paidPaypal" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN "paidRevolut" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN "paidCredia" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN "dismissed" boolean NOT NULL DEFAULT false
    `);

    // Existing incomes recorded money already received. Under the new split
    // that has to land in a method, or every past trip would read as unpaid
    // and its income would drop to zero. Cash is the safe assumption.
    await queryRunner.query(`
      UPDATE "trip_finance_entry"
      SET "paidCash" = "amount"
      WHERE "type" = 'income' AND "amount" > 0
    `);

    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      ADD CONSTRAINT "CHK_trip_finance_entry_methods_non_negative"
      CHECK ("paidCash" >= 0 AND "paidPaypal" >= 0 AND "paidRevolut" >= 0 AND "paidCredia" >= 0)
    `);

    // The rule the admin sees as "you can't pay more than the total".
    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      ADD CONSTRAINT "CHK_trip_finance_entry_paid_within_total"
      CHECK ("paidCash" + "paidPaypal" + "paidRevolut" + "paidCredia" <= "amount")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trip_finance_entry" DROP CONSTRAINT "CHK_trip_finance_entry_paid_within_total"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trip_finance_entry" DROP CONSTRAINT "CHK_trip_finance_entry_methods_non_negative"`,
    );
    // Dismissed rows were hidden, not deleted — drop them so the list the
    // admin sees is the same before and after a rollback.
    await queryRunner.query(`DELETE FROM "trip_finance_entry" WHERE "dismissed" = true`);
    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
        DROP COLUMN "dismissed",
        DROP COLUMN "paidCredia",
        DROP COLUMN "paidRevolut",
        DROP COLUMN "paidPaypal",
        DROP COLUMN "paidCash"
    `);
  }
}
