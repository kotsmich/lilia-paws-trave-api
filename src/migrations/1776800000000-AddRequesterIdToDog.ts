import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequesterIdToDog1776800000000 implements MigrationInterface {
  name = 'AddRequesterIdToDog1776800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" ADD COLUMN IF NOT EXISTS "requesterId" character varying`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_dog_requesterId" ON "dog" ("requesterId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_dog_requesterId"`);
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN IF EXISTS "requesterId"`);
  }
}
