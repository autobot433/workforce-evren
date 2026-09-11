# Verification record

Verified locally on September 10, 2026, using Node.js 24.21.0 and npm 11.19.0.

| Check                                            | Result                                                |
| ------------------------------------------------ | ----------------------------------------------------- |
| Prettier format check                            | Passed                                                |
| TypeScript strict typecheck                      | Passed                                                |
| Vitest domain tests                              | 22 passed                                             |
| Express/SQLite integration and persistence tests | 8 passed                                              |
| React interaction tests in jsdom                 | 5 passed                                              |
| Vite production build                            | Passed                                                |
| npm dependency audit                             | 0 known vulnerabilities at verification time          |
| Development startup and Vite API proxy           | HTTP 200; 12 placements returned through the proxy    |
| Built app startup                                | HTTP 200; healthy API; 12 fictional placements loaded |

The production JavaScript bundle is about 106 KiB compressed with gzip. This is a build artifact measurement, not a page-speed benchmark.

## Boundaries of this verification

- A local preview was made available, but no automated browser visual inspection, cross-browser testing, or full accessibility audit was performed. React tests use jsdom and stub native dialog methods.
- Docker configuration is included but was not built locally because Docker is not installed in the verification environment.
- GitHub Actions is configured but has not run on GitHub; no repository or public deployment has been created.
- Financial tests verify the documented demonstration policy, not accounting, tax, payroll, or legal compliance.
- Dependency audit results describe the installed lockfile at this point in time and may change as advisories are published.

## Manual browser review

When extending the application, review it at desktop and mobile widths and with keyboard-only navigation. Check opening and closing dialogs, focus restoration, narrow-screen tables, 200% text enlargement, CSV download, and changes across two browser windows. Run `npm run check` after editing.
