import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1776624042906 implements MigrationInterface {
    name = 'InitialSchema1776624042906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "destination" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "tripId" uuid, CONSTRAINT "PK_e45b5ee5788eb3c7f0ae41746e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pickup_location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "tripId" uuid, CONSTRAINT "PK_dff0bb23dcd6e0dd4c88db85374" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "trip_request" DROP COLUMN "dogs"`);
        await queryRunner.query(`ALTER TABLE "trip" DROP COLUMN "destinations"`);
        await queryRunner.query(`ALTER TABLE "trip" DROP COLUMN "pickupLocations"`);
        await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN "destinationId"`);
        await queryRunner.query(`ALTER TABLE "dog" ADD "destinationId" uuid`);
        await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN "pickupLocationId"`);
        await queryRunner.query(`ALTER TABLE "dog" ADD "pickupLocationId" uuid`);
        await queryRunner.query(`ALTER TABLE "destination" ADD CONSTRAINT "FK_ecf3ab32d3cee8d67e379db8e23" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pickup_location" ADD CONSTRAINT "FK_d1b1b2081bde91c52365f36c6de" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dog" ADD CONSTRAINT "FK_bb765a1f13b85be1ce1600c7319" FOREIGN KEY ("destinationId") REFERENCES "destination"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dog" ADD CONSTRAINT "FK_f93646ee40663ede40b5f5a9810" FOREIGN KEY ("pickupLocationId") REFERENCES "pickup_location"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dog" DROP CONSTRAINT "FK_f93646ee40663ede40b5f5a9810"`);
        await queryRunner.query(`ALTER TABLE "dog" DROP CONSTRAINT "FK_bb765a1f13b85be1ce1600c7319"`);
        await queryRunner.query(`ALTER TABLE "pickup_location" DROP CONSTRAINT "FK_d1b1b2081bde91c52365f36c6de"`);
        await queryRunner.query(`ALTER TABLE "destination" DROP CONSTRAINT "FK_ecf3ab32d3cee8d67e379db8e23"`);
        await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN "pickupLocationId"`);
        await queryRunner.query(`ALTER TABLE "dog" ADD "pickupLocationId" character varying`);
        await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN "destinationId"`);
        await queryRunner.query(`ALTER TABLE "dog" ADD "destinationId" character varying`);
        await queryRunner.query(`ALTER TABLE "trip" ADD "pickupLocations" text NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "trip" ADD "destinations" text DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "trip_request" ADD "dogs" jsonb NOT NULL`);
        await queryRunner.query(`DROP TABLE "pickup_location"`);
        await queryRunner.query(`DROP TABLE "destination"`);
    }

}
