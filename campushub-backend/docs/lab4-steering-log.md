# Lab 4 steering log

### Incident 1: Prior-lab active-only contract conflicts with Lab 4 history

- **Initial Agent Output:** The existing implementation, test expectations and OpenAPI definitions excluded CANCELLED records from user lookup. Reusing that contract unchanged would violate Lab 4's requirement to list all bookings. This was an inherited implementation mismatch discovered during review, not a newly generated hallucination or repeated failure loop.
- **Root Cause:** The prior lab explicitly specified active-only results; the new lab changes the scope to all student bookings. Carrying prior context forward without reconciling the new requirement would preserve the wrong behavior.
- **Remediation Prompt:** "List all bookings for the student, including CANCELLED records. Update the service, regression expectations, and both OpenAPI files together; keep cancelled reservations excluded from conflict detection."
- **Resolution:** Removed the status exclusion from user lookup, updated both API contracts and the existing regression expectation, and added an HTTP scenario proving cancelled history is returned while the same slot can immediately be booked again. All seven test groups passed against MongoDB 8.0.15 in an isolated replica set.

### Tool recovery: Local execution assumptions

- **Initial Agent Output:** The initial verification command assumed npm was on PATH; it was unavailable. The initial database launch also hit the sandbox's socket restriction.
- **Root Cause:** The desktop runtime provides Node at an explicit path, and local socket access required approved execution outside the sandbox.
- **Remediation:** Invoked the existing TypeScript, ESLint and Prettier packages directly with the bundled Node executable; ran an isolated loopback-only MongoDB process with approved permissions.
- **Resolution:** TypeScript compilation and ESLint passed; all database-backed endpoint tests passed. No dependencies or application credentials were changed.

## Scope and verification

Implemented strict isAvailable filtering, idempotent cancellation for PENDING and CONFIRMED bookings, cancelled booking history, and synchronized API documentation. Creation continues to return CONFIRMED, as specified by the existing contract; no additional confirmation endpoint was required by the lab's endpoint list. The original transaction-based overlap prevention remains in place.

Verification on October 19, 2026:

- TypeScript build: passed.
- ESLint: passed.
- Seven integration/regression groups: passed, zero failures.
- HTTP tests exercise 200, 201, 400, 409 and sanitized 500 responses, malformed inputs, overlap boundaries, timezone equivalence, parallel booking, pending/cancelled behavior, restart persistence, availability filtering and cancellation/rebooking.
- Endpoint checks were automated real HTTP requests against a listening Express app and real MongoDB; they are not represented as a student-performed manual audit.
- No new application-code failure loop was observed. If the instructor requires a newly generated failure rather than an inherited mismatch, this log should be supplemented with an actual student-observed incident.
- GitHub push and Canvas submission have not been performed.
