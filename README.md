# CampusHub - Lab 3

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

Tests require TEST_MONGODB_URI in .env, targeting a **dedicated disposable database**
whose name includes `test`. They delete resources and reservations in that database.
The supplied example uses campushub_test, separate from campushub. Test groups cover
the prior API scenarios, pending/cancelled semantics, persistence, errors, model
validation, and concurrent booking through separate service instances.

Actual results from the local MongoDB run are in docs/verification.txt. Compose itself
was not executed in the authoring environment; equivalent MongoDB 8.0.15 was run locally
as a single-node replica set for tests.

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
