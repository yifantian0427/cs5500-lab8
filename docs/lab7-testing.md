# Lab 7: Dynamic Test Generation and Edge-Case Prediction

This change adds Jest, ts-jest, Supertest, and a disposable MongoDB replica set. A replica set is required because reservation creation uses MongoDB transactions. Each suite gets its own server and each test clears and seeds its resources. Tests never connect to the development database.

## Run

```bash
npm install
npm test
npm run test:coverage
npm run typecheck
npm run lint
```

The first test run downloads a MongoDB binary, so internet access is needed initially. `npm install` also updates `package-lock.json`; commit that updated lockfile with the changes. The coverage run writes HTML to `coverage/index.html` and LCOV to `coverage/lcov.info`, and fails if statement or branch coverage is below 81%. Inspect the actual report before submission. Coverage includes every service and controller, including files not imported by the suites.

The previous Node test runner remains available as `npm run test:legacy`; it requires the existing dedicated replica-set test database configuration. Jest discovers only `src/**/__tests__/**/*.test.ts`, preventing the legacy runner from being mixed into Jest.

## Scenarios

- Resource seeding and type filtering; valid creation and active user lookup.
- Exact duplicate, enclosing/contained intervals and one-millisecond overlaps.
- Adjacent intervals accepted on either side; invalid, equal and reversed dates rejected.
- Missing and unavailable resources; pending and cancelled reservations.
- Independent service instances and concurrent HTTP requests: exactly one winner.
- Missing fields, unexpected properties, invalid calendar dates, timezone omissions, invalid identifiers, malformed JSON and wrong content type.
- Unexpected service failures return a sanitized HTTP 500 response.

Resource creation is exercised through the existing seeder. Cancellation is tested through both the service and PATCH endpoint, including idempotency, history retention, missing IDs, missing resource references, and immediate slot reuse. Resource tests include availability and combined filters.

## Design and validation

Application behavior is unchanged. All new helpers and suites are TypeScript, use the existing service/controller boundaries, and avoid `any`. The ESLint architecture restriction is relaxed only for test files so HTTP integration tests can construct service failures.

Lint, formatting of changed files, and `git diff --check` passed during preparation. Dependency installation failed with `ENOTFOUND registry.npmjs.org` in the editing environment. Test execution, TypeScript checking with the new test dependencies, and the coverage threshold are therefore unverified. No passing coverage report is claimed or fabricated. Run the commands above before submitting the repository link to Canvas.
