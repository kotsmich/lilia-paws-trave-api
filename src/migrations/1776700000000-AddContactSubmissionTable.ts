import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactSubmissionTable1776700000000 implements MigrationInterface {
  name = 'AddContactSubmissionTable1776700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contact_submission" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "submittedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying,
        "subject" character varying,
        "message" text NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_contact_submission" PRIMARY KEY ("id")
      )
    `);

    // Add missing columns if table already existed without them
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'contact_submission' AND column_name = 'deletedAt'
        ) THEN
          ALTER TABLE "contact_submission" ADD COLUMN "deletedAt" TIMESTAMP;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'contact_submission' AND column_name = 'isRead'
        ) THEN
          ALTER TABLE "contact_submission" ADD COLUMN "isRead" boolean NOT NULL DEFAULT false;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contact_submission_isRead" ON "contact_submission" ("isRead")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contact_submission_isRead"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_submission"`);
  }
}
