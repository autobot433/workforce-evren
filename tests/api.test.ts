import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/app';
import { createDatabase, type Store } from '../server/database';
import { seed } from '../shared/seed';
let store: Store;
beforeEach(() => {
  store = createDatabase(':memory:', false);
});
afterEach(() => store.close());
describe('workspace API', () => {
  it('creates, updates, archives, and restores with an audit history', async () => {
    const app = createApp(store);
    const created = await request(app).post('/api/employees').send(seed[0]).expect(201);
    expect(created.body.revision).toBe(1);
    const changed = { ...seed[0], billRate: 15000 };
    await request(app)
      .put(`/api/employees/${created.body.id}`)
      .send({ employee: changed, revision: 1 })
      .expect(200);
    await request(app)
      .put(`/api/employees/${created.body.id}`)
      .send({ employee: { ...changed, status: 'Archived' }, revision: 2 })
      .expect(200);
    await request(app)
      .put(`/api/employees/${created.body.id}`)
      .send({ employee: { ...changed, status: 'Bench' }, revision: 3 })
      .expect(200);
    const result = await request(app).get('/api/workspace').expect(200);
    expect(result.body.employees[0]).toMatchObject({
      revision: 4,
      status: 'Bench',
      billRate: 15000,
    });
    expect(result.body.events.map((e: { action: string }) => e.action)).toEqual([
      'Restored',
      'Archived',
      'Updated',
      'Created',
    ]);
    expect(result.body.events[2].details).toContain('billRate: 12500 → 15000');
  });
  it('rejects stale writes without changing the record or audit trail', async () => {
    const app = createApp(store);
    const e = store.add(seed[0]);
    store.update(e.id, { ...seed[0], name: 'Updated Name' }, 1);
    await request(app)
      .put(`/api/employees/${e.id}`)
      .send({ employee: { ...seed[0], billRate: 1 }, revision: 1 })
      .expect(409);
    expect(store.list()[0].name).toBe('Updated Name');
    expect(store.events()).toHaveLength(2);
  });
  it('validates malformed, out-of-range, and unexpected inputs', async () => {
    const app = createApp(store);
    for (const input of [
      { ...seed[0], hours: -1 },
      { ...seed[0], billRate: 10.5 },
      { ...seed[0], name: ' ' },
      { ...seed[0], admin: true },
    ]) {
      await request(app).post('/api/employees').send(input).expect(400);
    }
    expect(store.list()).toHaveLength(0);
    expect(store.events()).toHaveLength(0);
  });
  it('uses parameterized storage for hostile-looking text', async () => {
    await request(createApp(store))
      .post('/api/employees')
      .send({ ...seed[0], name: "Robert'); DROP TABLE employees;--" })
      .expect(201);
    expect(store.list()).toHaveLength(1);
  });
  it('rejects cross-origin writes and unsupported body types', async () => {
    const app = createApp(store);
    await request(app)
      .post('/api/employees')
      .set('Origin', 'https://evil.example')
      .send(seed[0])
      .expect(403);
    await request(app)
      .post('/api/employees')
      .set('Sec-Fetch-Site', 'cross-site')
      .send(seed[0])
      .expect(403);
    await request(app).post('/api/employees').type('form').send('name=Test').expect(415);
    await request(app)
      .post('/api/employees')
      .set('Content-Type', 'application/json')
      .send('{broken')
      .expect(400);
  });
  it('returns appropriate missing-resource and payload-size errors', async () => {
    const app = createApp(store);
    await request(app)
      .put('/api/employees/00000000-0000-4000-8000-000000000000')
      .send({ employee: seed[0], revision: 1 })
      .expect(404);
    await request(app)
      .post('/api/employees')
      .send({ ...seed[0], name: 'a'.repeat(40000) })
      .expect(413);
    await request(app).get('/api/not-found').expect(404);
  });
  it('sets response hardening and no-cache headers', async () => {
    const res = await request(createApp(store)).get('/api/workspace').expect(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
it('persists edits across database restarts without reseeding', () => {
  const dir = mkdtempSync(join(tmpdir(), 'evren-test-'));
  const path = join(dir, 'test.db');
  let fileStore: Store | undefined;
  try {
    fileStore = createDatabase(path);
    const e = fileStore.list()[0];
    fileStore.update(e.id, { ...seed[0], name: 'Persistent Person' }, e.revision);
    fileStore.close();
    fileStore = undefined;
    fileStore = createDatabase(path);
    expect(fileStore.list()).toHaveLength(seed.length);
    expect(fileStore.list().some((e) => e.name === 'Persistent Person')).toBe(true);
    expect(fileStore.events()).toHaveLength(1);
  } finally {
    fileStore?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
