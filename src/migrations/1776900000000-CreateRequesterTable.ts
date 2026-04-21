import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRequesterTable1776900000000 implements MigrationInterface {
  name = 'CreateRequesterTable1776900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "requester" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "email" text,
        "phone" text,
        "tripId" character varying,
        "sourceRequestId" character varying,
        CONSTRAINT "PK_requester" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_requester_tripId" ON "requester" ("tripId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_requester_tripId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "requester"`);
  }
}
