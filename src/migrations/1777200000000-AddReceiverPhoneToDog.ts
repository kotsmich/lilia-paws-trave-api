import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceiverPhoneToDog1777200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" ADD "receiverPhone" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN "receiverPhone"`);
  }
}
