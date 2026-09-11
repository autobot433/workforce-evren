# Workforce Evren architecture and tradeoffs

## 1. A typed application, not a distributed system

React 19 renders four working views. Hash navigation preserves direct links and back/forward behavior without adding a routing dependency. Express 5 serves the API, and in built mode serves the Vite output too. TypeScript strict mode covers UI, shared logic, server, and tests.

Local component state handles filters, forms, pagination, navigation, and scenario inputs. A top-level snapshot holds saved records. Successful mutations update the local record and refresh the authoritative snapshot. A monotonically increasing request ID prevents older reads from replacing newer state. Errors retain the last successful snapshot and expose retry.

**Tradeoff:** the roster is fetched as a whole and filtered on the client. This keeps a 12-record demonstration inspectable; a large deployment should add indexed server-side pagination and query contracts.

## 2. SQLite with explicit transaction boundaries

Node 24's built-in `node:sqlite` API avoids native third-party driver installation. Every mutation uses a prepared statement. An update reads the current revision inside `BEGIN IMMEDIATE`, checks the client's expected revision, writes the new record, then writes its audit event before committing. Any thrown error rolls back both operations.

The revision is server-owned. An editor captures the revision when opened. If a second window has already saved the placement, the outdated window receives 409 and keeps its draft visible instead of overwriting the newer record. A no-op update returns the existing record without adding noise to the audit trail.

The first schema uses a validated JSON payload for the small placement aggregate, with explicit ID, revision, and timestamp columns. Audit records use a separate relational table with a foreign key. SQLite's JSON validity check is a second storage boundary; Zod is the authoritative business schema.

**Tradeoff:** JSON payloads make aggregate changes easy, but do not enforce each field's business constraint inside SQLite. For external writers or large analytical queries, normalize the fields, add SQL constraints and indexes, and introduce ordered migrations. `metadata.schema_version = 1` identifies this initial schema; it is not a general-purpose migration runner.

WAL improves reader/writer coexistence but `DatabaseSync` is synchronous and a single connection blocks the Node event loop during work. The short local queries fit the demo. High traffic would justify asynchronous access or a service database.

## 3. Financial logic as pure functions

`shared/domain.ts` owns both validation and calculation. It accepts bounded integer cents and whole hours, uses basis points for policy constants, and rounds overhead, employer burden, and incentive at the monthly line-item level. Values within the validated bounds remain below JavaScript's safe integer limit.

Tier comparisons cross-multiply integers rather than rounding a displayed margin. There are no holes between tiers. Zero revenue has a defined 0% displayed margin and no incentive; losses remain visible and never create negative payouts. Portfolio gross margin is total gross profit divided by total revenue, not an arithmetic mean of placement percentages.

The scenario planner can vary cost assumptions but never writes them to the workspace. The default saved policy is a versioned constant. A production historical ledger would need effective dates, persisted policy versions and input snapshots, actual hours, and immutable posted payouts.

## 4. Local threat model

This is a single-operator demo, not an authentication product. It binds to loopback by default, rejects non-localhost Host headers to reduce DNS-rebinding exposure, and rejects cross-site or unapproved-origin browser writes. Non-JSON writes and oversized JSON bodies are refused. The API does not opt into cross-origin resource sharing.

Prepared statements protect SQL boundaries. React renders record values as text. CSV fields are quoted; values beginning with formula-like prefixes, including after whitespace, receive an apostrophe. Built responses include a content-security policy and frame/content-type protections. Secrets and databases are ignored by Git.

These controls **are not authorization**: local processes can call the API, and anyone with local database access can edit data. Do not expose this service publicly or store sensitive workforce information in it. Public multi-user hosting would require authenticated sessions, authorization on every record, tenant isolation, HTTPS-aware origin configuration, rate limits, backups, and an operational audit policy.

## 5. Testing boundaries

- Pure domain tests cover money arithmetic, boundary tiers, losses, zero values, aggregation, validation, and CSV escaping.
- Supertest exercises real Express routes against actual in-memory SQLite, including validation, stale writes, archive/restore, and response protections.
- A file-backed SQLite test closes and reopens a database to verify persistence and one-time seeding.
- React Testing Library exercises user-visible search, filtering, save behavior, errors, and scenario changes in jsdom.

The component tests mock the HTTP client, not financial logic. Native modal methods are stubbed because jsdom does not implement browser modal behavior. These tests do not establish visual quality or cross-browser focus behavior; those need browser review. See the verification record for the exact scope executed.

## References

- [Node.js SQLite API](https://nodejs.org/api/sqlite.html)
- [Vite getting started](https://vite.dev/guide/)
