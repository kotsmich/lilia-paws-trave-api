import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTripFinanceEntryTable1777500000000
  implements MigrationInterface
{
  name = 'CreateTripFinanceEntryTable1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "trip_finance_entry" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tripId" uuid NOT NULL,
        "type" character varying(16) NOT NULL,
        "name" character varying(120) NOT NULL,
        "amount" numeric(12,2) NOT NULL DEFAULT 0,
        "note" text,
        "requesterId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trip_finance_entry" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_trip_finance_entry_type"
          CHECK ("type" IN ('expense','income')),
        CONSTRAINT "CHK_trip_finance_entry_expense_no_requester"
          CHECK ("type" <> 'expense' OR "requesterId" IS NULL),
        CONSTRAINT "CHK_trip_finance_entry_amount_non_negative"
          CHECK ("amount" >= 0)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_trip_finance_entry_tripId" ON "trip_finance_entry" ("tripId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_trip_finance_entry_trip_type" ON "trip_finance_entry" ("tripId","type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_trip_finance_entry_requesterId" ON "trip_finance_entry" ("requesterId")`,
    );

    // "One income row per payer" — enforced in the DB, not just in the service.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_trip_finance_entry_trip_requester"
      ON "trip_finance_entry" ("tripId","requesterId")
      WHERE "requesterId" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      ADD CONSTRAINT "FK_trip_finance_entry_trip"
      FOREIGN KEY ("tripId") REFERENCES "trip"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // SET NULL, not CASCADE: a deleted requester must not destroy the money record.
    await queryRunner.query(`
      ALTER TABLE "trip_finance_entry"
      ADD CONSTRAINT "FK_trip_finance_entry_requester"
      FOREIGN KEY ("requesterId") REFERENCES "requester"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trip_finance_entry" DROP CONSTRAINT "FK_trip_finance_entry_requester"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trip_finance_entry" DROP CONSTRAINT "FK_trip_finance_entry_trip"`,
    );
    await queryRunner.query(`DROP INDEX "UQ_trip_finance_entry_trip_requester"`);
    await queryRunner.query(`DROP INDEX "IDX_trip_finance_entry_requesterId"`);
    await queryRunner.query(`DROP INDEX "IDX_trip_finance_entry_trip_type"`);
    await queryRunner.query(`DROP INDEX "IDX_trip_finance_entry_tripId"`);
    await queryRunner.query(`DROP TABLE "trip_finance_entry"`);
  }
}
