import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPickupLocationsToTrip1744700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trip" ADD COLUMN IF NOT EXISTS "pickupLocations" text NOT NULL DEFAULT '[]'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trip" DROP COLUMN IF EXISTS "pickupLocations"`);
  }
}
