# CampusHub backend agent instructions

These instructions govern all work in this repository. Review generated code against them before reporting completion.

## Authorized stack

- Use TypeScript, Node.js, Express, and Mongoose for application code. Do not add other runtime libraries without explicit user approval.
- Use only TypeScript source files under `src/`. Do not create raw JavaScript source files.
- ESLint, Prettier, TypeScript, and their type/configuration packages are allowed development tools.
- Keep credentials in `.env`; commit only `.env-example` with safe placeholders.

## Architecture

- `src/routes/`: Express route definitions and middleware mapping only. No business logic or database calls.
- `src/controllers/`: Parse requests, call services, and send responses with appropriate status codes. No direct database queries.
- `src/services/`: Business logic and orchestration. Services may call models when persistence is required; keep logic independent of Express request and response objects.
- `src/models/`: Mongoose schemas, models, and their TypeScript interfaces only. No HTTP or business logic.
- `src/middleware/`: Reusable Express middleware, including centralized error handling.
- `src/app.ts`: Configure Express and mount routes. `src/server.ts`: Start the listener. Do not start listening when `app.ts` is imported.

## Type safety and error handling

- Declare explicit TypeScript interfaces for every function's parameters and return value, including route handlers, service methods, and database schemas. Use named response and request interfaces when they add clarity.
- Never use `any`, including in casts or lint suppressions. Use `unknown` and narrow it when necessary.
- Enable strict TypeScript checking. Keep builds, type checks, and lint checks passing.
- Handle every promise. Forward asynchronous controller failures to centralized error middleware and send a consistent JSON error response. Do not leave floating promises or expose stack traces to clients.
- Validate and normalize untrusted inputs before passing them to services or models.

## Changes and review

- Follow the existing structure and make the smallest coherent change.
- Run relevant checks and exercise affected endpoints when possible.
- In every PR or diff description, concisely state what was built, why it was built, and how these context rules shaped the change. Mention any checks that could not run.

## Lab 5 frontend extension

The user requested a React/TypeScript/Vite frontend in `client/`; these frontend dependencies and their testing tools are authorized for this lab. Backend stack restrictions remain in effect for backend code. Use functional components with explicit prop interfaces, standard React hooks, and modular consistent styling. Keep network operations in `client/src/api/campushubApi.ts`, never inline in JSX. Match `docs/openapi.yaml`; handle loading, empty, success and error states for every asynchronous workflow. Do not use `any`. Guard stale read responses after user/filter changes.
