import { spawnSync } from 'node:child_process';
import process from 'node:process';

const password = process.env.DATABASE_PASS;
if (!password) {
  console.error('DATABASE_PASS must be configured before running Prisma.');
  process.exit(1);
}

const databaseUrl = `postgresql://neondb_owner:${encodeURIComponent(password)}@ep-broad-river-azye21g6-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`;
const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

process.exit(result.status ?? 1);
