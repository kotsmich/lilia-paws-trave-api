import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the `payment` entry type — an outgoing log of what was handed over and
 * to whom, kept out of the income/expense/profit arithmetic.
 *
 * The requester-link constraint is also tightened while we are here: it now
 * states positively that only incomes may carry a requesterId, so `payment`
 * is covered without needing another constraint per new type.
 */
export class AddPaymentTypeToTripFinanceEntry1777600000000
  implements MigrationInterface
{
  name = 'AddPaymentTypeToTripFinanceEntry1777600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      DROP CONSTRAINT "CHK_trip_finance_entry_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      ADD CONSTRAINT "CHK_trip_finance_entry_type"
      CHECK ("type" IN ('expense','income','payment'))
    `);

    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      DROP CONSTRAINT "CHK_trip_finance_entry_expense_no_requester"
    `);
    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      ADD CONSTRAINT "CHK_trip_finance_entry_only_income_has_requester"
      CHECK ("type" = 'income' OR "requesterId" IS NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Any existing payment rows must go before the old, narrower CHECK can hold.
    await queryRunner.query(
      `DELETE FROM "trip_finance_entry" WHERE "type" = 'payment'`,
    );

    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      DROP CONSTRAINT "CHK_trip_finance_entry_only_income_has_requester"
    `);
    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      ADD CONSTRAINT "CHK_trip_finance_entry_expense_no_requester"
      CHECK ("type" <> 'expense' OR "requesterId" IS NULL)
    `);

    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      DROP CONSTRAINT "CHK_trip_finance_entry_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      ADD CONSTRAINT "CHK_trip_finance_entry_type"
      CHECK ("type" IN ('expense','income'))
    `);
  }
}
