import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGenderToDog1743854000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column with a temporary default so existing rows satisfy NOT NULL,
    // then drop the default so future inserts must always supply the value.
    await queryRunner.query(
      `ALTER TABLE "dog" ADD "gender" character varying NOT NULL DEFAULT 'male'`,
    );
    await queryRunner.query(
      `ALTER TABLE "dog" ALTER COLUMN "gender" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN "gender"`);
  }
}
