# Lab 3 personal manual audit

This checklist is prepared by AI. It is not evidence that the student performed the
required "NO AI" review. Complete it yourself after inspecting the source.

- [ ] Inspect Resource.model.ts: required fields, enum, public ID, strict exported interface.
- [ ] Inspect Reservation.model.ts: ObjectId resource reference, dates, userId, status enum.
- [ ] Check controllers contain no model imports, ORM calls, or booking business logic.
- [ ] Check services contain no Express imports, request/response objects or res.status calls.
- [ ] Check routes only map methods/paths to controllers.
- [ ] Check environment settings are managed under src/config with no committed credentials.
- [ ] Follow one POST from route to controller, validation, transaction and response.
- [ ] Explain why a shared resource write prevents simultaneous double bookings.
- [ ] Explain the need for a running replica set and seeded resources before testing.
- [ ] Run the manual Lab 2 requests; verify 200, 201, 400 and 409 outcomes.
- [ ] Restart the app and verify reservations still exist.
- [ ] Review the changes before committing and submitting.

Personal findings / any refactor requested:

Student to complete.

The Part 3 Check 1 paragraph contains contradictory wording ("ORM methods or
repositories should be used in the Controller"). Its surrounding instructions and
Part 2 clearly require the controller to know only service methods; this implementation
follows that consistent boundary.
