import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the "paid may not exceed the total" CHECK.
 *
 * It made a legitimate edit impossible: lowering or clearing an income's total
 * while methods were already recorded was rejected outright, so the row could
 * not be saved at all. The rule the admin actually asked for — you cannot enter
 * more than the total — is enforced on the method inputs, which cap themselves
 * at whatever the total still leaves.
 *
 * An over-collected row is now allowed to exist and is shown in red until the
 * admin resolves it, rather than silently refusing to save.
 */
export class RelaxIncomePaidWithinTotal1777800000000 implements MigrationInterface {
  name = 'RelaxIncomePaidWithinTotal1777800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      DROP CONSTRAINT IF EXISTS "CHK_trip_finance_entry_paid_within_total"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // NOT VALID: rows recorded while the rule was relaxed may already break it,
    // and a rollback should not fail on data the app deliberately allowed.
    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      ADD CONSTRAINT "CHK_trip_finance_entry_paid_within_total"
      CHECK ("paidCash" + "paidPaypal" + "paidRevolut" + "paidCredia" <= "amount") NOT VALID
    `);
  }
}
