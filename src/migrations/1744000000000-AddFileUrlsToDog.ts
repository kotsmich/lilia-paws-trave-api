import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileUrlsToDog1744000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" ADD "photoUrl" character varying`);
    await queryRunner.query(`ALTER TABLE "dog" ADD "documentUrl" character varying`);
    await queryRunner.query(`ALTER TABLE "dog" ADD "documentType" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN "documentType"`);
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN "documentUrl"`);
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN "photoUrl"`);
  }
}
