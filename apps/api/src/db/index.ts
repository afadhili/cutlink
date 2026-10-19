import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
export function connectDatabase(url: string) {
  const client = postgres(url, { max: 10, connect_timeout: 10 });
  return { db: drizzle(client, { schema }), close: () => client.end({ timeout: 5 }) };
}
export type Database = ReturnType<typeof connectDatabase>['db'];
