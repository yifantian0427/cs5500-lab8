# CampusHub

TypeScript / Express 5 / Mongoose implementation built from the saved Lab 2 API contract.
The three endpoints and public response shapes are preserved. Resource and Reservation
schemas are split into the lab's required files; reservations store ObjectId references
while clients continue to use IDs such as `res-101`.

## Run

Requires Node 24.21+ and MongoDB 8 with a replica set (Docker Compose is one setup option).

```sh
npm ci
cp .env-example .env
docker compose up -d --wait
npm run seed
npm run build
npm start
```

If you already have MongoDB, set MONGODB_URI in .env to your replica-set URI instead
of starting Compose. An ordinary standalone MongoDB server cannot run booking
transactions. Startup checks this requirement and fails before serving requests.
The database connection lives under src/config; app.ts provides initializeApp and
server.ts starts the listener only after connection succeeds.

Seed creates three resources if absent and does not overwrite existing records.
Restarting the app preserves data. User IDs remain contract identifiers; no user
registration or authentication endpoint is added.

## Verify

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
```

`npm test` runs Jest and Supertest against an isolated MongoDB replica set.
Run `npm run test:coverage` to generate the Lab 7 coverage report.
The first run downloads a MongoDB binary. See [Lab 7 testing](docs/lab7-testing.md).
The earlier Node test suite is retained as `npm run test:legacy`; it requires
`TEST_MONGODB_URI` pointing to a dedicated disposable replica-set database.

## Manual API checks

With the server running and sample resources seeded:

```sh
curl 'http://localhost:3000/api/v1/resources?type=ROOM'
curl -i -X POST http://localhost:3000/api/v1/reservations \
  -H 'Content-Type: application/json' \
  -d '{"resourceId":"res-101","userId":"user-456","startTime":"2026-10-01T10:00:00Z","endTime":"2026-10-01T11:00:00Z"}'
curl http://localhost:3000/api/v1/reservations/user/user-456
```

Expect 200, 201, 200 on a fresh seeded database. Repeat the POST for 409. Use res-103
for 400 (unavailable), omit a required property for 400, and try an adjacent time slot
for 201. Historical times are accepted, matching the Lab 2 contract.

## Architecture

- Routes map URLs to controller methods.
- Controllers extract/validate input, await services, and send HTTP responses.
- Services perform business rules and all model queries.
- Models export strict document interfaces and schemas, without HTTP concerns.
- Middleware formats errors consistently; Express 5 forwards rejected async handlers.
- Configuration manages the connection URI and listening port.

Each reservation transaction first increments an internal counter on its resource.
Concurrent bookings for that resource cause MongoDB transaction conflicts and retry
against a fresh snapshot before testing overlap. The overlap rule is start < existingEnd
and end > existingStart. No cross-process in-memory lock is used. Date fields support
indexed comparisons; original date strings are retained internally so timezone
representations round-trip without changing the API.

The booking guarantee assumes all booking writes go through ReservationService;
manual database writes can bypass its business rules.

## Submission

Review docs/manual-audit.md yourself: the handout requires a non-AI manual audit.
Copy this project's changes into your existing repository, excluding node_modules,
dist and .env. Commit and push, then submit your repository URL to Canvas.
No GitHub push or Canvas submission was performed by this deliverable.

The original Lab 2 contract-audit.md is retained with the Lab 3 persistence changes
noted. docs/openapi.yaml and docs/openapi.json contain the same contract in YAML and
JSON respectively. Lint rules enforce imports across the architecture boundaries.

## Lab 4 updates

`GET /api/v1/resources` accepts `type` and `isAvailable=true|false`, separately
or together. Invalid and repeated filter values return 400.
`GET /api/v1/reservations/user/{userId}` now includes cancelled booking history.
`PATCH /api/v1/reservations/{id}/cancel` returns the cancelled reservation (200),
is safe to repeat, and releases the slot. Invalid or missing IDs return 400,
consistent with the existing error contract. Creation still returns CONFIRMED.

The service retains strict half-open overlap comparisons and transaction-based
serialization across concurrent callers. Controllers validate inputs, services
own persistence and business rules, and Express 5 forwards failures to the existing
JSON error handler. These changes follow AGENTS.md without new runtime libraries.
See docs/lab4-steering-log.md for the observed contract mismatch and verification.

Manual cancellation check: create a booking, PATCH its returned ID at the cancel
endpoint, repeat the PATCH, then repeat the original POST. Expect 201, 200, 200,
and 201; user lookup should include both the cancelled and replacement records.

## Lab 5 frontend

The React/TypeScript client is in `client/`. See [client setup and testing](client/README.md) and [verification results](docs/lab5-verification.md).

## Repository layout

Run backend commands from the repository root. There is one backend source tree
in `src/` and one backend package/configuration at the root. `client/` contains
the React frontend and its separate package. Both share `src/types/reservation.ts`.
`docs/` contains the API contract and lab notes. The former nested
`campushub-backend/` project has been consolidated into these directories.

## Lab 8 auto-healing CI

See [setup, break-and-fix demonstration, and review instructions](docs/lab8-auto-healing.md).
The workflow opens a repair PR only after the unchanged Jest suite and static
checks pass. Repository secret `OPENAI_API_KEY` and GitHub Actions PR creation
permissions must be configured before the demonstration.
