# HTTP API

Base URL: `http://localhost:3001/api`. All monetary fields are integer USD cents. Responses are JSON. Writes require `Content-Type: application/json`. The service is local and has no authentication.

| Method | Path             | Result                                                        |
| ------ | ---------------- | ------------------------------------------------------------- |
| GET    | `/health`        | Health and local-demo mode                                    |
| GET    | `/workspace`     | All placements, including archived, and latest 100 events     |
| POST   | `/employees`     | Create a placement; return 201 with generated ID and revision |
| PUT    | `/employees/:id` | Replace validated input fields using an expected revision     |

## Create

```sh
curl http://localhost:3001/api/employees \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alex Morgan","role":"Software engineer","client":"Northstar","department":"Engineering","status":"Active","billRate":12500,"payRate":7000,"hours":160,"startDate":"2026-09-01"}'
```

Input constraints:

- `name`, `role`, `client`: trimmed strings, 2–80 characters.
- `department`: `Engineering`, `Design`, `Operations`, or `Data`.
- `status`: `Active`, `Bench`, or `Archived`.
- `billRate`, `payRate`: integer cents, 0–100000 ($1,000/hour). Active records require a positive bill rate.
- `hours`: integer, 0–240.
- `startDate`: a real calendar date in `YYYY-MM-DD` format. This is descriptive; it does not prorate planned hours.
- Unknown fields are rejected.

Response adds `id` (UUID), `revision` (positive integer), and `updatedAt` (UTC timestamp).

## Update

Use the ID and revision returned by the API:

```json
{
  "revision": 1,
  "employee": {
    "name": "Alex Morgan",
    "role": "Software engineer",
    "client": "Northstar",
    "department": "Engineering",
    "status": "Active",
    "billRate": 13000,
    "payRate": 7000,
    "hours": 160,
    "startDate": "2026-09-01"
  }
}
```

A changed record increments the revision. An unchanged replacement does not increment it or write an audit event. A stale revision returns 409; fetch the workspace and reconcile before retrying. Archive and restore use this same operation with a changed status. There is no hard-delete endpoint.

## Errors

```json
{ "error": "Human-readable error message" }
```

| Status | Meaning                                                      |
| ------ | ------------------------------------------------------------ |
| 400    | Invalid fields, invalid ID, or malformed JSON                |
| 403    | Non-localhost host or disallowed browser origin              |
| 404    | Unknown placement or API route                               |
| 409    | Revision conflict                                            |
| 413    | Body exceeds 32 KiB                                          |
| 415    | Unsupported write content type                               |
| 500    | Unexpected server error; internal details remain server-side |

Activity events contain `id`, `employeeId`, `employeeName`, `action`, `details`, and `createdAt`. Monetary changes in the audit details retain their stored cent values. The log is operational history for one local operator, not an authenticated compliance ledger.
