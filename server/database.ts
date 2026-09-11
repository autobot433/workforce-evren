import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { seed } from '../shared/seed';
import type { Employee, EmployeeInput, AuditEvent } from '../shared/domain';

export class ConflictError extends Error {}
export class NotFoundError extends Error {}
export function createDatabase(path: string, withSeed = true) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload)), revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_events (id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id TEXT NOT NULL REFERENCES employees(id), employee_name TEXT NOT NULL, action TEXT NOT NULL, details TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    INSERT OR IGNORE INTO metadata VALUES ('schema_version', '1');`);
  const decode = (row: Record<string, unknown>): Employee => ({
    ...(JSON.parse(row.payload as string) as EmployeeInput),
    id: row.id as string,
    revision: row.revision as number,
    updatedAt: row.updated_at as string,
  });
  const list = () =>
    (
      db
        .prepare("SELECT * FROM employees ORDER BY json_extract(payload, '$.name') COLLATE NOCASE")
        .all() as Record<string, unknown>[]
    ).map(decode);
  const events = () =>
    db
      .prepare(
        'SELECT id, employee_id AS employeeId, employee_name AS employeeName, action, details, created_at AS createdAt FROM audit_events ORDER BY id DESC LIMIT 100',
      )
      .all() as unknown as AuditEvent[];
  const transaction = <T>(fn: () => T): T => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };
  const add = (input: EmployeeInput, action = 'Created') =>
    transaction(() => {
      const employee = {
        ...input,
        id: randomUUID(),
        revision: 1,
        updatedAt: new Date().toISOString(),
      };
      db.prepare('INSERT INTO employees VALUES (?, ?, ?, ?)').run(
        employee.id,
        JSON.stringify(input),
        1,
        employee.updatedAt,
      );
      db.prepare(
        'INSERT INTO audit_events (employee_id, employee_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)',
      ).run(employee.id, input.name, action, `${input.role} · ${input.client}`, employee.updatedAt);
      return employee;
    });
  const update = (id: string, input: EmployeeInput, revision: number) =>
    transaction(() => {
      const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
      if (!row) throw new NotFoundError('Placement not found');
      const current = decode(row);
      if (current.revision !== revision)
        throw new ConflictError(
          'This placement changed in another window. Close the editor, refresh, and try again.',
        );
      const updatedAt = new Date().toISOString();
      const changes = (Object.keys(input) as (keyof EmployeeInput)[]).filter(
        (k) => input[k] !== current[k],
      );
      if (!changes.length) return current;
      db.prepare(
        'UPDATE employees SET payload = ?, revision = revision + 1, updated_at = ? WHERE id = ?',
      ).run(JSON.stringify(input), updatedAt, id);
      const action =
        input.status === 'Archived' && current.status !== 'Archived'
          ? 'Archived'
          : current.status === 'Archived' && input.status !== 'Archived'
            ? 'Restored'
            : 'Updated';
      db.prepare(
        'INSERT INTO audit_events (employee_id, employee_name, action, details, created_at) VALUES (?, ?, ?, ?, ?)',
      ).run(
        id,
        input.name,
        action,
        changes.map((k) => `${k}: ${current[k]} → ${input[k]}`).join('; '),
        updatedAt,
      );
      return { ...input, id, revision: revision + 1, updatedAt };
    });
  if (withSeed && !db.prepare("SELECT value FROM metadata WHERE key = 'seeded'").get()) {
    // The seed is a first-run fixture; an empty roster is never silently repopulated.
    transaction(() => {
      const insert = db.prepare('INSERT INTO employees VALUES (?, ?, 1, ?)');
      for (const input of seed)
        insert.run(randomUUID(), JSON.stringify(input), new Date().toISOString());
      db.prepare("INSERT INTO metadata VALUES ('seeded', 'true')").run();
    });
  }
  return { list, events, add, update, close: () => db.close() };
}
export type Store = ReturnType<typeof createDatabase>;
