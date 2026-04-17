import { MigrationInterface, QueryRunner } from 'typeorm';
import { randomUUID } from 'crypto';

export class DestinationAsObject1744300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new destinationId column to dog
    await queryRunner.query(`ALTER TABLE "dog" ADD COLUMN IF NOT EXISTS "destinationId" character varying`);

    // 2. Transform trip.destinations from string[] to {id, name}[] and migrate dog destination names → IDs
    const trips: { id: string; destinations: string }[] = await queryRunner.query(
      `SELECT id, destinations FROM "trip"`,
    );

    for (const trip of trips) {
      let raw: unknown;
      try { raw = JSON.parse(trip.destinations || '[]'); } catch { raw = []; }
      if (!Array.isArray(raw) || raw.length === 0) continue;

      // Already migrated if first element is an object
      if (typeof raw[0] === 'object' && raw[0] !== null) continue;

      const destObjects = (raw as string[]).map((name) => ({ id: randomUUID(), name }));

      await queryRunner.query(
        `UPDATE "trip" SET "destinations" = $1 WHERE "id" = $2`,
        [JSON.stringify(destObjects), trip.id],
      );

      // Map old name-based dog assignments to new destination IDs
      for (const dest of destObjects) {
        await queryRunner.query(
          `UPDATE "dog" SET "destinationId" = $1 WHERE "tripId" = $2 AND "adminDestination" = $3`,
          [dest.id, trip.id, dest.name],
        );
      }
    }

    // 3. Drop the old adminDestination column
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN IF EXISTS "adminDestination"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dog" ADD COLUMN IF NOT EXISTS "adminDestination" character varying`);
    await queryRunner.query(`ALTER TABLE "dog" DROP COLUMN IF EXISTS "destinationId"`);
    // Note: trip.destinations is not reverted (data loss acceptable on rollback)
  }
}
