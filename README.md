# CampusHub backend

Initial Express and TypeScript service for the CampusHub semester project.

## Requirements

- Node.js 24.21.0 or later
- npm 11.19.1 or later

## Run

```sh
npm ci
cp .env-example .env
npm run dev
```

Then request `GET http://localhost:3000/api/v1/health`. The expected response is HTTP 200 with `{"status":"ok"}`.

## Checks

```sh
npm run typecheck
npm run lint
npm run build
```

See `AGENTS.md` for the repository's AI coding rules.
