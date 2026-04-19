import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevokedTokenTable1744800000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "revoked_token" (
        "jti" character varying NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_revoked_token_jti" PRIMARY KEY ("jti")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_revoked_token_expiresAt" ON "revoked_token" ("expiresAt")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_revoked_token_expiresAt"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "revoked_token"`);
  }
}
