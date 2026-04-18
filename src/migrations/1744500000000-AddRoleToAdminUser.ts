import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleToAdminUser1744500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_user_role_enum') THEN
          CREATE TYPE "admin_user_role_enum" AS ENUM ('admin', 'operator');
        END IF;
      END $$
    `);
    await queryRunner.query(`
      ALTER TABLE "admin_user"
      ADD COLUMN IF NOT EXISTS "role" "admin_user_role_enum" NOT NULL DEFAULT 'operator'
    `);
    // Existing users were the primary admin account
    await queryRunner.query(`
      UPDATE "admin_user" SET "role" = 'admin'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "admin_user" DROP COLUMN IF EXISTS "role"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "admin_user_role_enum"`);
  }
}
