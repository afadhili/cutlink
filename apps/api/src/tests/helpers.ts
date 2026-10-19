import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { connectDatabase } from '../db';
import { createApp } from '../app';
import { readEnv } from '../config/env';
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) throw new Error('TEST_DATABASE_URL must point to a dedicated database ending in _test');
export const connection = connectDatabase(url);
export const db = connection.db;
export const config = readEnv({ ...process.env, DATABASE_URL: url });
export const app = createApp(db, config, { rateLimit: 1000 });
export async function setup() { await migrate(db, { migrationsFolder: new URL('../db/migrations', import.meta.url).pathname }); }
export function request(path: string, method = 'GET', body?: unknown, target = app) {
  return target.handle(new Request(`http://localhost${path}`, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined }));
}
