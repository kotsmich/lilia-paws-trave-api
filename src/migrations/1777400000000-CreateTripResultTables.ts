import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTripResultTables1777400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "trip_result" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "date" character varying NOT NULL,
        "departureCity" character varying NOT NULL,
        "arrivalCity" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trip_result" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_trip_result_date" ON "trip_result" ("date")`);

    await queryRunner.query(`
      CREATE TABLE "trip_result_photo" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "url" character varying NOT NULL,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "tripResultId" uuid NOT NULL,
        CONSTRAINT "PK_trip_result_photo" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_trip_result_photo_tripResultId" ON "trip_result_photo" ("tripResultId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "trip_result_photo"
      ADD CONSTRAINT "FK_trip_result_photo_tripResult"
      FOREIGN KEY ("tripResultId") REFERENCES "trip_result"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trip_result_photo" DROP CONSTRAINT "FK_trip_result_photo_tripResult"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_trip_result_photo_tripResultId"`);
    await queryRunner.query(`DROP TABLE "trip_result_photo"`);
    await queryRunner.query(`DROP INDEX "IDX_trip_result_date"`);
    await queryRunner.query(`DROP TABLE "trip_result"`);
  }
}
