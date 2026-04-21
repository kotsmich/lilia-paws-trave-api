import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeDogFieldsNullable1777000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" ALTER COLUMN "size" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "dog" ALTER COLUMN "gender" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "dog" ALTER COLUMN "age" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "dog" ALTER COLUMN "chipId" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "dog" SET "size" = 'small' WHERE "size" IS NULL`);
    await queryRunner.query(`UPDATE "dog" SET "gender" = 'male' WHERE "gender" IS NULL`);
    await queryRunner.query(`UPDATE "dog" SET "age" = 0 WHERE "age" IS NULL`);
    await queryRunner.query(`UPDATE "dog" SET "chipId" = '' WHERE "chipId" IS NULL`);
    await queryRunner.query(`ALTER TABLE "dog" ALTER COLUMN "size" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "dog" ALTER COLUMN "gender" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "dog" ALTER COLUMN "age" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "dog" ALTER COLUMN "chipId" SET NOT NULL`);
  }
}
