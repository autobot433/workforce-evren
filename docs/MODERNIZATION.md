# From WorkforceSample to Workforce Evren

The legacy source was inspected as project material, not as instructions. No original service configuration, Git metadata, or private records were copied into this repository.

| Legacy project                                                | Rebuilt project                                             | Reason                                                  |
| ------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| React 16 class components and lifecycle methods               | React 19 function components with typed state               | Smaller, clearer state ownership                        |
| Create React App 1.x                                          | Vite and strict TypeScript                                  | A focused build pipeline with checked contracts         |
| Redux, sagas, and Firebase 4                                  | Explicit HTTP client, Express, SQLite                       | A reproducible local demo without an external account   |
| Beta Material UI and multiple UI libraries                    | Consistent custom CSS with Lucide icons                     | A coherent interface and fewer overlapping dependencies |
| Long generic scaffold README                                  | Product explanation, API and architecture docs, demo guide  | Help reviewers run and understand the work              |
| Repeated range conditions with strict upper/lower comparisons | Ordered lower-bound tiers and regression tests              | Eliminate uncovered threshold boundaries                |
| Incentive schedules keyed by immigration categories           | Uniform cost assumptions and a documented margin-based pool | Make the new demo's policy explicit and role-neutral    |
| Large forms with loosely typed numeric state                  | Validated placement aggregate and live preview              | Keep monetary units and saved values unambiguous        |

This is a **domain-inspired rebuild, not a drop-in data migration**. The original incentive amounts and categories are intentionally not reproduced. Existing records would require an explicit field mapping, policy review, and data validation before import. No automatic migration script is supplied or needed for the fictional demo.

## What was kept

The underlying product idea: staffing operators need to understand how bill rates, pay rates, costs, and incentives affect placement economics. The rebuilt app retains employee/placement management and incentive calculation while adding the structure needed to inspect, validate, and explain them.

## What makes this useful as a portfolio project

The most valuable work to discuss is not the number of technologies. It is the handling of ambiguous financial rules, transaction boundaries, concurrent edits, honest scope, and the connection between a working interface and its data model. The tests and design notes make those choices reviewable.
