import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createDatabase } from './database';
import { createApp } from './app';
const dbPath = resolve(process.env.DATABASE_PATH || 'data/workforce.db');
mkdirSync(dirname(dbPath), { recursive: true });
const store = createDatabase(dbPath);
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const server = createApp(store).listen(port, host, () =>
  console.log(`Workforce Evren API: http://${host}:${port}`),
);
function close() {
  server.close(() => {
    store.close();
    process.exit(0);
  });
}
process.once('SIGTERM', close);
process.once('SIGINT', close);
