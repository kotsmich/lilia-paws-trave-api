import 'dotenv/config';
import * as readline from 'readline';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

const BCRYPT_COST = 12;

type Args = {
  email: string | null;
  password: string | null;
  autoYes: boolean;
  dryRun: boolean;
  help: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { email: null, password: null, autoYes: false, dryRun: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--yes' || a === '-y') args.autoYes = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--email') args.email = argv[++i] ?? null;
    else if (a === '--password') args.password = argv[++i] ?? null;
    else if (a.startsWith('--email=')) args.email = a.slice('--email='.length);
    else if (a.startsWith('--password=')) args.password = a.slice('--password='.length);
  }
  return args;
}

function printUsage(): void {
  console.log(`
Reset the password of an existing admin_user row.

Usage:
  npm run admin:reset-password -- --email <email> --password <newPassword> [--yes] [--dry-run]

Flags:
  --email <addr>      Email of the admin to update (required)
  --password <pwd>    New plaintext password to set (required, will be bcrypt-hashed)
  --yes, -y           Skip the confirmation prompt
  --dry-run           Show the target without updating
  --help, -h          Show this message

The script never creates a new admin — it only updates the passwordHash of an
existing row matched by email. If the email isn't found, it exits with an error.
`);
}

function ask(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  if (!args.email || !args.password) {
    console.error('Error: both --email and --password are required.');
    printUsage();
    process.exit(1);
  }

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
  console.log(`Admin email: ${args.email}`);

  const existing: Array<{ id: string }> = await ds.query(
    `SELECT id FROM "admin_user" WHERE email = $1`,
    [args.email],
  );

  if (existing.length === 0) {
    console.error(`\nNo admin_user row found with email "${args.email}". Aborting.`);
    await ds.destroy();
    process.exit(1);
  }

  if (args.dryRun) {
    console.log('\n--dry-run set: not updating anything.');
    await ds.destroy();
    return;
  }

  if (!args.autoYes) {
    const answer = await ask('\nThis will OVERWRITE the password for the admin above. Type "yes" to continue: ');
    if (answer.trim().toLowerCase() !== 'yes') {
      console.log('Aborted.');
      await ds.destroy();
      return;
    }
  }

  const passwordHash = await bcrypt.hash(args.password, BCRYPT_COST);
  await ds.query(
    `UPDATE "admin_user" SET "passwordHash" = $1 WHERE email = $2`,
    [passwordHash, args.email],
  );

  console.log(`\nDone. Password updated for ${args.email}.`);
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
