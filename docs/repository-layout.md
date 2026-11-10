# Repository consolidation

The repository previously contained two independently runnable backends: the root project and `campushub-backend/`. The nested copy had the later Lab 4–6 implementation, including cancellation, availability filters, cancellation history, the React frontend, and shared frontend/backend types. Keeping the older root copy would have discarded these features.

The repository now uses one layout:

- `src/`: the current backend, plus Lab 7 Jest helpers and suites.
- `client/`: the React frontend, moved intact with its package and lockfile.
- `docs/`: the current API contract and all lab notes.
- Root configuration: backend package, TypeScript, ESLint, Jest, Compose, and agent guidance.

Backend source and documentation were merged from the newer nested copy before removing that directory. Root Lab 7 additions were retained and updated for the current API. Frontend type imports still resolve to `src/types/reservation.ts`; Vite still proxies `/api` to port 3000. Root AGENTS.md includes the frontend instructions, and the Cursor guidance now applies from the root. Commands in the frontend README now start from the repository root.

## Validation

- Backend application and legacy test TypeScript checking passed, excluding the new Jest files whose dependencies could not be installed.
- Backend lint passed, including the new suites.
- All 8 frontend workflow tests passed after the move.
- Frontend TypeScript checking and production build passed after the move.
- `git diff --check` passed.
- Jest execution and coverage remain unverified: npm dependency installation failed with `ENOTFOUND registry.npmjs.org`. Run `npm install`, `npm run typecheck`, and `npm run test:coverage` with network access. Commit the resulting backend lockfile update.

The original folder was read-only to this editing session. These changes are in the writable checkout; the accompanying cumulative patch applies against the original repository's starting commit and includes the earlier Lab 7 additions. Apply that patch only once. Local ignored dependencies, build output, and environment files in the original nested directory are not moved by a Git patch; reinstall dependencies in the root and `client/`, and configure the root `.env` for the backend. Review any remaining ignored nested files before removing them.
