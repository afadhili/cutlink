import { readEnv } from './config/env';
import { connectDatabase } from './db';
import { createApp } from './app';
const config = readEnv();
const connection = connectDatabase(config.databaseUrl);
const app = createApp(connection.db, config).listen({ port: config.port, maxRequestBodySize: 512 * 1024 });
console.log(`Cutlink API running at http://localhost:${config.port}`);
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  await app.stop();
  await connection.close();
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
