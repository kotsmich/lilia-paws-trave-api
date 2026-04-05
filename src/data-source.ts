import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * Standalone DataSource used by the TypeORM CLI (migration:generate, migration:run, etc.).
 * The NestJS app uses its own TypeOrmModule config in app.module.ts.
 *
 * Requires a .env file (or env vars) with DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
  username: process.env['DB_USER'],
  password: process.env['DB_PASS'],
  database: process.env['DB_NAME'],
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
