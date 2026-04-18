import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPickupLocationIdToDog1744600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" ADD COLUMN IF NOT EXISTS "pickupLocationId" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN IF EXISTS "pickupLocationId"`);
  }
}
