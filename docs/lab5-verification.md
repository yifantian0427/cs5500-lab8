# Lab 5 verification

Verified October 26, 2026.

- Frontend production build: PASS (strict TypeScript + Vite).
- Frontend UI/API tests: 7/7 PASS.
- Backend build: PASS.
- Backend integration tests: 7/7 PASS against a fresh isolated MongoDB 8 replica set, using a database with `test` in its name.
- Browser: real resource directory loads three seeded resources; unavailable Chemistry Lab cannot be booked.
- Browser: Study Room 302 booking created for student-001, November 2, 2026, 10:00–11:00 America/Los_Angeles.
- Browser: duplicate booking showed “This resource is already reserved for the selected time window. Please choose another time.” The form remained usable.
- Browser: cancellation refreshed My bookings to the empty state.
- No backend application source changes were needed; Vite forwards development API requests to the existing server.

The frontend test suite uses mocked HTTP responses to exercise UI failure states. The backend suite uses actual persistence, including concurrent booking conflicts, cancellation and immediate rebooking. The browser conflict audit used actual HTTP and database storage, not mocked responses.

GitHub push and Canvas submission have not been performed. No live student data or existing lab database was modified.
