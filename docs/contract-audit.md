# Lab 2 contract decisions, with Lab 3 update

## Historical Lab 2 AI generation record

This solution was created with Codex using the lab's AI-assisted option. The contract was written first, then used to define the interfaces, router and implementation. Equivalent generation instruction:

> Using docs/openapi.json as the authoritative contract, generate the TypeScript interfaces in src/types/reservation.ts and the Express router in src/routes/reservation.routes.ts. Match the exact routes, fields, enums, response codes and validation rules. Follow AGENTS.md: keep HTTP handling in controllers, booking logic in services and centralized errors in middleware. Provide an in-memory implementation and tests without a live database.

## Audit

| Requirement                            | Implementation                                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| GET /api/v1/resources                  | Router `/resources`, mounted once at `/api/v1`; optional type filter; 200/400/500                   |
| POST /api/v1/reservations              | Router `/reservations`; 201/400/409/500                                                             |
| GET /api/v1/reservations/user/{userId} | Router `/reservations/user/:userId`; 200/400/500                                                    |
| Resource properties                    | id, name, type, location, isAvailable; all required                                                 |
| Reservation properties                 | id, resourceId, userId, startTime, endTime, status; all required in responses                       |
| Error shape                            | code and message for validation, conflicts and internal errors                                      |
| Strict input                           | Unknown body properties, missing fields, invalid IDs, invalid dates and invalid time order rejected |
| Business logic                         | Overlap iff newStart < existingEnd and newEnd > existingStart                                       |

## Explicit choices where the handout is ambiguous

1. Resource types are ROOM, EQUIPMENT and LAB, following the domain requirements. The handout's STUDY_ROOM example contradicts that enum; it returns 400 here. Use ROOM for a successful filtered query.
2. A separate CreateReservationRequest schema includes only resourceId, userId, startTime and endTime. The server generates id and CONFIRMED status, matching the handout's POST example. Clients cannot assign status or id.
3. Active means status PENDING or CONFIRMED. This is status-based, including historical records; CANCELLED records never block bookings and are excluded from active results.
4. Intervals are half-open: a booking ending at 11:00 does not conflict with one starting at 11:00. Comparisons use absolute instants, so equivalent timezone offsets conflict.
5. Date strings use a documented ISO 8601 subset with timezone, seconds and optional 1–3 fractional digits. Calendar validity is checked in code; format/pattern alone does not check date order or overlap. Leap seconds and lowercase t/z are excluded.
6. Unknown or unavailable resources return 400 with a specific code. Unknown users return an empty list. User name is an assumed minimal field because the handout does not specify a User shape.
7. IDs are nonempty strings of up to 100 letters, digits, underscores or hyphens. This supports the handout's res-101 and user-456 values rather than requiring MongoDB ObjectIds.
8. Mongoose stores Date values and an internal _id; the API exposes string dates and a separate public id. Lab 3 wires the models into the API: resourceId is an internal ObjectId reference translated to the public resource ID by services. Transactions serialize bookings per resource. Date text is also retained for exact API round trips.
9. The application exposes the three lab routes. The unused health scaffold files from Lab 1 remain available but are not mounted in this lab app.

## Architecture and reference

The inherited AGENTS.md shaped the implementation: thin routes, controllers for request/response handling, services for booking logic, models for schemas, no extra runtime dependencies, strict TypeScript and centralized errors. No new API endpoints were invented.

OpenAPI structure follows the [official OpenAPI 3.0.3 specification](https://spec.openapis.org/oas/v3.0.3.html). Standalone JSON Schemas use Draft 7. See verification.txt for actual check results.

## Lab 3 update

Persistence now uses MongoDB. Resource listing is isolated in resource.service.ts and resource.controller.ts. Booking logic remains in reservation.service.ts; services have no Express dependencies, and controllers do not query models. Configuration is centralized in src/config. The API contract is unchanged except for its environment description. See manual-audit.md for the required personal review and verification.txt for executed checks.
