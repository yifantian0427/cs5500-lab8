# Lab 6: Refactoring and context optimization

## Changes

- Kept AGENTS.md as the architecture and stack authority; replaced repeated frontend rules in .cursorrules with a short reference and targeted source navigation.
- Added .cursorignore for dependencies, build output, coverage, lockfiles, logs, generated directories, source maps, and secrets. Ignore files reduce automatic context discovery; they are not an access control mechanism.
- Audited controllers: reservation and resource controllers already use Express 5 promise forwarding. Removed the health controller's redundant try/catch. Existing src/middleware/errorHandler.ts remains the centralized JSON error formatter.
- Extracted booking validation, submission, conflict handling, and state into client/src/hooks/useBooking.ts.
- Extracted reservation fetching, cancellation, loading/error state, refresh, and active filtering into client/src/hooks/useReservations.ts. Request generations prevent old reads or cancellations from affecting a new student or refreshed view.
- Removed duplicate frontend wire interfaces. Both layers now use src/types/reservation.ts; the frontend API module re-exports existing names for compatibility. The shared file contains only types, so frontend bundles do not import server runtime code.

## Agent guidance used

Refactor reservation API and state logic into focused hooks, preserve validation and 409 messages, use the existing centralized Express 5 error middleware, and reuse the backend's wire types. Keep network requests in the API client and obey AGENTS.md without adding dependencies.

## Verification

- Backend TypeScript check, lint, and build passed.
- Frontend TypeScript/production build passed.
- All 8 frontend workflow tests passed, including a new delayed cancellation failure after switching students.
- Backend integration tests could not run: their setup requires TEST_MONGODB_URI pointing to a dedicated replica-set test database. Do not point these tests at application data; they clear collections.
- Source-focused query: locate the booking/list components, their API client, and the reservation error middleware using only src/ and client/src/. Answer: BookingForm.tsx -> useBooking.ts -> campushubApi.ts; UserReservations.tsx -> useReservations.ts -> campushubApi.ts; backend errors -> src/middleware/errorHandler.ts. No build, lockfile, dependency, log, or source-map contents were needed.
- Ran the lightweight booking/reservation query in Cursor with `.cursorrules` and `.cursorignore` present. The response identified the components, custom hooks, API client, shared types, and backend error middleware. Its inspected-file list contained only rules and application source; it reported no reads of dependencies, build output, coverage, lockfiles, logs, or source maps. Saved the response as verification evidence. Token usage was not recorded, so no numerical reduction is claimed.

Booking creation and reservation listing are a thin React UI over shared types, with all reservation state and HTTP work in hooks and campushubApi. The backend validates the body, writes inside a Mongo transaction, and lets Express 5 send thrown errors to errorHandler.

Shared contract
src/types/reservation.ts is the wire contract both sides use. Dates are ISO 8601 strings.

CreateReservationRequest: resourceId, userId, startTime, endTime
Reservation: that payload plus id and status (PENDING | CONFIRMED | CANCELLED)
ErrorResponse: { code, message }
The client re-exports those types from client/src/api/campushubApi.ts (CreateReservationRequest as CreateReservationDTO).

Booking creation
App holds userId, the selected Resource, and a revision counter. Choosing a resource from ResourceList mounts BookingForm.
BookingForm only renders start/end datetime inputs. Submit calls useBooking(...).submit.
useBooking checks times and student ID, converts local datetime-local values to ISO, then calls createReservation. On success it runs onBooked. A 409 is shown as a double-booking message; other failures use errorMessage.
onBooked in App closes the form, bumps revision, and shows “Reservation confirmed…”.
createReservation POSTs /api/v1/reservations (or VITE_API_BASE_URL) with JSON. request() times out at 15s and maps non-OK JSON to ApiError using ErrorResponse.
Backend path:

createReservationRouter → POST /reservations → ReservationController.create
Requires application/json. reservationBody rejects extra keys, validates IDs (1–100 [A-Za-z0-9_-]), and requires timezone-aware ISO datetimes.
ReservationService.create requires startTime < endTime, then runs a replica-set transaction:
bump bookingVersion on the resource (serializes concurrent bookings)
400 if missing or isAvailable is false
overlap check against PENDING/CONFIRMED → 409 DOUBLE_BOOKING
insert with status: 'CONFIRMED' and return { ...input, id, status: 'CONFIRMED' } (201)
Thrown **ApiError**s from src/services/errors.ts are not caught in the controller. Express 5 forwards the rejected promise to src/middleware/errorHandler.ts, which returns { code, message } with the error’s status. Client 4xx-ish parse/body errors become 400 VALIDATION_ERROR. Anything else is 500 INTERNAL_ERROR.

Reservation listing
App renders UserReservations with userId and revision (key={userId} remounts on identity change).
useReservations loads on userId, revision, or retry. A generation counter drops stale responses. It calls fetchUserReservations → GET /reservations/user/:userId.
UserReservations shows loading, error+retry, empty state, or non-cancelled items sorted by start time. Cancel is in the same hook (PATCH .../cancel) but is not part of listing itself.
Backend path:

listUser → identifier(userId) → ReservationService.listUserReservations
Finds all reservations for that user (including cancelled), sorts by _id, maps Mongo resourceId to the public resource id, and returns ISO strings from startTimeText / endTimeText.
The UI filters CANCELLED out; the API does not.
A successful book increments revision, which retriggers this fetch so “My bookings” updates.

Pieces by layer
Layer	Role
Components
BookingForm (create UI), UserReservations (list/cancel UI), App (identity, selection, refresh token)
Hooks
useBooking (create + local validation), useReservations (list, refresh, cancel)
API client
client/src/api/campushubApi.ts (request, createReservation, fetchUserReservations)
Shared types
src/types/reservation.ts
Error middleware
src/middleware/errorHandler.ts, mounted last in createApp
ResourceList is only how a resource is chosen for the booking form.

Files inspected
.cursorrules
.cursorignore
client/src/App.tsx
client/src/components/BookingForm.tsx
client/src/components/UserReservations.tsx
client/src/hooks/useBooking.ts
client/src/hooks/useReservations.ts
client/src/api/campushubApi.ts
src/types/reservation.ts
src/middleware/errorHandler.ts
src/middleware/validation.ts
src/controllers/reservation.controller.ts
src/routes/reservation.routes.ts
src/services/reservation.service.ts
src/services/errors.ts
src/app.ts
I also listed src/ and client/src/ (filename search + keyword grep) and did not open node_modules, dist/build, coverage, lockfiles, logs, or source maps. I did not read docs/openapi.yaml (no contract change) or tests.

## Submission

Review the diff, commit and push the lab changes, then submit the GitHub repository URL to Canvas. The repository's existing README explains how to configure MongoDB and run the application.
