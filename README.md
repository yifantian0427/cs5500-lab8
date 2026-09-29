# CampusHub — Lab 2

Completed OpenAPI contract and executable reservation engine, based on the Lab 1 TypeScript/Express scaffold. No database is needed to run or test this lab.

## Run

```sh
npm ci
npm run build
npm start
```

The API listens on http://localhost:3000/api/v1. `npm run dev` runs the TypeScript development server. Use `PORT` to override the port.

## Required deliverables

- `docs/openapi.json`: authoritative OpenAPI 3.0.3 contract.
- `src/types/reservation.ts`: contract-derived TypeScript interfaces.
- `src/routes/reservation.routes.ts`: all three required Express routes.
- `docs/schemas/`: standalone JSON Schemas for User, Resource, Reservation, create requests and errors.
- `src/models/domain.models.ts`: corresponding Mongoose schema drafts; not connected to a database.
- `docs/contract-audit.md`: generation prompt, decisions and verification notes.

## Try the endpoints

```sh
curl -i 'http://localhost:3000/api/v1/resources'
curl -i 'http://localhost:3000/api/v1/resources?type=ROOM'
curl -i 'http://localhost:3000/api/v1/resources?type='
curl -i -X POST 'http://localhost:3000/api/v1/reservations' \
  -H 'Content-Type: application/json' \
  -d '{"resourceId":"res-101","userId":"user-456","startTime":"2026-10-01T10:00:00Z","endTime":"2026-10-01T11:00:00Z"}'
# Repeat the POST for a 409 DOUBLE_BOOKING response.
curl -i 'http://localhost:3000/api/v1/reservations/user/user-456'
```

Expected statuses, in order: 200, 200, 400, 201; repeated POST: 409; user lookup: 200.

## Checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
```

Tests cover the HTTP endpoints, input errors, overlapping and adjacent slots, equivalent time zones, concurrent requests, cancelled and pending records, safe 500 responses and Mongoose validation without a database.

## Scope and submission

Data is in memory and resets when the server restarts. This is a single-process lab implementation, without authentication or persistent storage. A persistent deployment needs transactional concurrency protection for bookings; an ordinary index alone cannot prevent overlapping intervals.

Copy these files into your Lab 1 repository, review the changes, run the checks, then commit and push. Submit your repository link in Canvas. This package has not been pushed or submitted.
