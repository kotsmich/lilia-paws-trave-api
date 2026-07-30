import 'dotenv/config';
import * as readline from 'readline';
import { DataSource } from 'typeorm';

const TABLES = ['trip_request', 'trip', 'requester', 'dog', 'contact_submission'] as const;

function ask(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function getCounts(ds: DataSource): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const t of TABLES) {
    const [{ count }] = await ds.query(`SELECT COUNT(*)::int AS count FROM "${t}"`);
    counts[t] = count;
  }
  return counts;
}

function printCounts(label: string, counts: Record<string, number>) {
  console.log(`\n${label}:`);
  for (const t of TABLES) console.log(`  ${t}: ${counts[t]}`);
}

async function main() {
  const autoYes = process.argv.includes('--yes') || process.argv.includes('-y');
  const dryRun = process.argv.includes('--dry-run');

  const ds = new DataSource({
    type: 'postgres',
    host: process.env['DB_HOST'] ?? 'localhost',
    port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
    username: process.env['DB_USER'],
    password: process.env['DB_PASS'],
    database: process.env['DB_NAME'],
    synchronize: false,
    logging: false,
  });

  await ds.initialize();

  const opts = ds.options as { host: string; port: number; database: string };
  console.log(`\nTarget: ${opts.database} @ ${opts.host}:${opts.port}`);
  console.log('Tables (TRUNCATE RESTART IDENTITY CASCADE):');
  for (const t of TABLES) console.log(`  - ${t}`);
  console.log('\nNote: CASCADE will also clear "destination" and "pickup_location" (FK to "trip").');

  const before = await getCounts(ds);
  printCounts('Current row counts', before);

  if (dryRun) {
    console.log('\n--dry-run set: not deleting anything.');
    await ds.destroy();
    return;
  }

  if (!autoYes) {
    const answer = await ask('\nThis will PERMANENTLY delete all rows from the listed tables. Type "yes" to continue: ');
    if (answer.trim().toLowerCase() !== 'yes') {
      console.log('Aborted.');
      await ds.destroy();
      return;
    }
  }

  const tablesList = TABLES.map((t) => `"${t}"`).join(', ');
  await ds.query(`TRUNCATE TABLE ${tablesList} RESTART IDENTITY CASCADE`);

  const after = await getCounts(ds);
  printCounts('Done. New row counts', after);

  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
