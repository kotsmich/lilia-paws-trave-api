import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingDogColumns1744200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" ADD IF NOT EXISTS "adminDestination" character varying`);
    await queryRunner.query(`ALTER TABLE "dog" ADD IF NOT EXISTS "requesterName" text`);
    await queryRunner.query(`ALTER TABLE "dog" ADD IF NOT EXISTS "requesterEmail" text`);
    await queryRunner.query(`ALTER TABLE "dog" ADD IF NOT EXISTS "requesterPhone" text`);
    await queryRunner.query(`ALTER TABLE "dog" ADD IF NOT EXISTS "requestId" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN IF EXISTS "requestId"`);
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN IF EXISTS "requesterPhone"`);
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN IF EXISTS "requesterEmail"`);
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN IF EXISTS "requesterName"`);
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN IF EXISTS "adminDestination"`);
  }
}
