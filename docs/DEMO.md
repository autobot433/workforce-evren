# Five-minute demo and interview guide

## Demo sequence

1. **0:00 — State the problem.** “Staffing teams need to see whether a placement is profitable and understand the incentive calculation behind it.” Start on Overview with the seeded data.
2. **0:40 — Inspect a risk.** Open a placement in “Worth a closer look.” Explain the difference between bill rate, wages, employer burden, and operating overhead.
3. **1:30 — Model a decision.** Open Scenario planner, select a saved placement, change its bill rate, and compare net contribution with the baseline. Point out that no record is modified.
4. **2:30 — Demonstrate persistence.** Add a fictional placement or update a rate in the directory. Show the changed overview totals and activity event; refresh the page.
5. **3:20 — Explain one hard edge case.** Open `shared/domain.ts` and the threshold tests. Explain why comparing rounded percentages can assign the wrong incentive tier.
6. **4:10 — Show reliability.** Run `npm run check`. Explain how an expected revision prevents one window overwriting another, and why the audit write belongs in the same transaction.
7. **4:50 — Be specific about limits.** The app is a local single-operator demo, not a payroll platform. Explain what authentication and historical policy snapshots would require before a production rollout.

## Questions worth preparing for

**Why SQLite?** It makes the demo reproducible and gives real constraints and transactions without a cloud account. Its synchronous API and single-writer behavior are an intentional small-workspace tradeoff.

**Why integer cents?** Money should not accumulate binary floating-point rounding artifacts. Each monthly cost is rounded once. The tests show the exact contract.

**Why not Redux?** The current app has one authoritative server snapshot and local screen state. A larger workflow could justify a cache/query library; this scope does not need global event orchestration.

**What happens if two windows edit a placement?** Each editor carries the server revision. The second save fails with 409 if its revision is stale, preserving the newer record and leaving the stale draft visible for reconciliation.

**How would you scale it?** Normalize frequently queried fields, add server pagination and indexes, adopt authenticated tenancy and per-record authorization, make policy history explicit, and move long-running work off the request path. Measure before distributing services.

**What was modernized?** See the legacy comparison. The business problem was retained, but the source was rewritten and the incentive policy deliberately redesigned. It is not a compatibility migration.

## Resume wording you can adapt

Use only wording you can explain and defend after reviewing the implementation:

> Modernized a legacy staffing application into a full-stack React/TypeScript workspace with a SQLite-backed API, explainable margin modeling, revision-based conflict detection, and transactional audit history.

> Added automated domain, HTTP integration, persistence, and UI tests covering financial boundaries, invalid inputs, archive/restore, and failed-edit recovery; configured reproducible GitHub CI.

Do not claim real users, revenue improvements, production deployment, or business impact that has not been measured. Be candid about development assistance, and practice explaining or changing the code yourself.
