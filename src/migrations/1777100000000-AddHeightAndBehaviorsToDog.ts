import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHeightAndBehaviorsToDog1777100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" ADD "height" character varying`);
    await queryRunner.query(`ALTER TABLE "dog" ADD "behaviors" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN "behaviors"`);
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN "height"`);
  }
}
