import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDestinationsToTrip1744100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trip" ADD "destinations" text DEFAULT '[]'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trip" DROP COLUMN "destinations"`);
  }
}
