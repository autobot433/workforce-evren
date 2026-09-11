import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { z } from 'zod';
import { employeeInput } from '../shared/domain';
import { ConflictError, NotFoundError, type Store } from './database';

export function createApp(store: Store) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(req.hostname)) {
      res.status(403).json({ error: 'This workspace only accepts localhost requests' });
      return;
    }
    next();
  });
  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy':
        "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'",
    });
    next();
  });
  // This is a local, single-operator demo. Reject cross-site browser mutations.
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(req.method)) {
      const origin = req.get('origin');
      if (
        req.get('sec-fetch-site') === 'cross-site' ||
        (origin &&
          !['http://127.0.0.1:5173', 'http://localhost:5173', `http://${req.get('host')}`].includes(
            origin,
          ))
      ) {
        res.status(403).json({ error: 'Cross-origin writes are not allowed' });
        return;
      }
      if (!req.is('application/json')) {
        res.status(415).json({ error: 'Use application/json' });
        return;
      }
    }
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', mode: 'local-demo' }));
  app.get('/api/workspace', (_req, res) =>
    res.json({ employees: store.list(), events: store.events() }),
  );
  app.post('/api/employees', (req, res) =>
    res.status(201).json(store.add(employeeInput.parse(req.body))),
  );
  app.put('/api/employees/:id', (req, res) => {
    const { revision, employee } = z
      .object({ revision: z.number().int().positive(), employee: employeeInput })
      .strict()
      .parse(req.body);
    res.json(store.update(z.uuid().parse(req.params.id), employee, revision));
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));
  const dist = path.resolve('dist');
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.use(
    (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
        return;
      }
      if (error instanceof ConflictError) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof SyntaxError) {
        res.status(400).json({ error: 'Invalid JSON body' });
        return;
      }
      if (
        typeof error === 'object' &&
        error !== null &&
        'type' in error &&
        error.type === 'entity.too.large'
      ) {
        res.status(413).json({ error: 'Request is too large' });
        return;
      }
      console.error('Request failed:', error);
      res.status(500).json({ error: 'Unable to complete this request' });
    },
  );
  return app;
}
