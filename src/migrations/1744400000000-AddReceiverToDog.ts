import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceiverToDog1744400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" ADD COLUMN IF NOT EXISTS "receiver" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN IF EXISTS "receiver"`);
  }
}
