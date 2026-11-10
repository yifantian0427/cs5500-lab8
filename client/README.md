# CampusHub frontend — Lab 5

React + TypeScript + Vite client integrated with the Lab 4 API. No mock data is used in the application. Student ID selection is a lab identity selector, not authentication.

## Run locally

From the repository root:

```sh
npm ci
docker compose up -d --wait
```

Create a `.env` file in the backend folder containing:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/campushub?replicaSet=rs0
PORT=3000
```

Then:

```sh
npm run seed
npm run dev
```

In a second terminal:

```sh
cd client
npm ci
npm run dev
```

Open the URL Vite prints. The Vite development server proxies `/api` to the backend on port 3000, avoiding cross-origin problems without modifying backend code. `localhost` in the Docker replica-set config must resolve to the local machine.

## Build and test

```sh
cd client
npm test
npm run build
```

The production output is `client/dist`. Production hosting must forward `/api/v1` requests to the backend on the same origin, or set `VITE_API_BASE_URL` at build time and configure the backend to allow that origin. `vite preview` is a static build preview; the development proxy is configured only for `npm run dev`.

## Lab requirements

- `src/api/campushubApi.ts`: contract-aligned DTOs and the four required typed service methods; fetch uses a 15-second timeout and converts network/HTTP errors to actionable errors.
- `src/components/ResourceList.tsx`: ROOM / EQUIPMENT / LAB filter, resource cards, unavailable resources disabled, loading, empty, retry states, and stale-response protection.
- `src/components/BookingForm.tsx`: required times, end-after-start validation, local-to-UTC conversion, duplicate-submit prevention, explicit 409 alert, loading state cleared in `finally`.
- `src/components/UserReservations.tsx`: active reservations sorted by time; cancellation updates the returned status, then refetches the list. Failures retain the booking and allow retry.
- `src/App.tsx`: student selector, successful booking notice and dashboard refresh. Student changes unmount the old dashboard/form to isolate in-flight mutations.
- `../AGENTS.md` and `../.cursorrules`: functional components, explicit props, React hooks, consistent styling, typed API services.
- `src/workflows.test.tsx`: seven tests cover API routes/verbs/payloads, network errors, validation, 409 recovery, creation/cancellation, stale reads, and retry.

## Manual conflict audit

1. Run the backend and frontend and choose a valid student ID.
2. Reserve Study Room 302 for a start/end window.
3. Reserve the same room with the same times again.
4. Confirm the explicit red conflict alert appears and the submit button becomes usable again.
5. Close the form and cancel the first booking in My bookings. Confirm it disappears.
6. Book that time window again; cancellation frees the slot.

An end-to-end browser audit completed steps 1–5 against a real isolated MongoDB replica set. Backend integration tests separately verified immediate rebooking after cancellation. See `../docs/lab5-verification.md`.

## Submission

Merge this `client/` folder, the updated `AGENTS.md` and `.cursorrules`, and `docs/lab5-verification.md` into your existing backend repository. Commit the client lockfile. Do not commit `node_modules`, `dist`, `.env`, or local databases. Push the repository and submit its URL to Canvas after reviewing the result.
