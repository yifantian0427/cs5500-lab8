import request from 'supertest';
import { createApp } from '../../app.js';
import { payload } from '../../test/fixtures.js';
import { ReservationService } from '../../services/reservation.service.js';
import type {
  CreateReservationRequest,
  Reservation,
} from '../../types/reservation.js';
const app = createApp();
test('POST returns 201, duplicate returns 409, and GET lists reservations', async (): Promise<void> => {
  const created = await request(app)
    .post('/api/v1/reservations')
    .send(payload)
    .expect(201);
  expect(created.body).toEqual({
    ...payload,
    id: expect.any(String),
    status: 'CONFIRMED',
  });
  const conflict = await request(app)
    .post('/api/v1/reservations')
    .send(payload)
    .expect(409);
  expect(conflict.body.code).toBe('DOUBLE_BOOKING');
  const list = await request(app)
    .get(`/api/v1/reservations/user/${payload.userId}`)
    .expect(200);
  expect(list.body).toEqual([created.body]);
  const empty = await request(app)
    .get('/api/v1/reservations/user/unknown')
    .expect(200);
  expect(empty.body).toEqual([]);
});
test.each(['ROOM', 'EQUIPMENT', 'LAB'])(
  'GET filters resources by %s',
  async (type): Promise<void> => {
    const result = await request(app)
      .get('/api/v1/resources')
      .query({ type })
      .expect(200);
    expect(result.body).toEqual([expect.objectContaining({ type })]);
  },
);
test('GET returns all resources without a filter', async (): Promise<void> => {
  const result = await request(app).get('/api/v1/resources').expect(200);
  expect(result.body).toHaveLength(3);
});
test.each(['type=', 'type=OTHER', 'type=ROOM&type=LAB'])(
  'rejects invalid filters %s',
  async (query): Promise<void> => {
    await request(app).get(`/api/v1/resources?${query}`).expect(400);
  },
);
test.each(['resourceId', 'userId', 'startTime', 'endTime'])(
  'rejects missing %s',
  async (field): Promise<void> => {
    const body: Record<string, unknown> = { ...payload };
    delete body[field];
    const result = await request(app)
      .post('/api/v1/reservations')
      .send(body)
      .expect(400);
    expect(result.body.code).toBe('VALIDATION_ERROR');
  },
);
test.each([
  {},
  [],
  { ...payload, userId: '' },
  { ...payload, resourceId: { $ne: null } },
  { ...payload, extra: true },
  { ...payload, startTime: 123 },
  { ...payload, startTime: 'not-a-date' },
  { ...payload, startTime: '2026-02-30T10:00:00Z' },
  { ...payload, startTime: '2026-11-10T10:00:00' },
  { ...payload, endTime: payload.startTime },
  { ...payload, endTime: '2026-11-10T09:00:00Z' },
  { ...payload, resourceId: 'missing' },
  { ...payload, resourceId: 'res-103' },
])('rejects adversarial payload %#', async (body): Promise<void> => {
  const result = await request(app)
    .post('/api/v1/reservations')
    .send(body)
    .expect(400);
  expect(Object.keys(result.body).sort()).toEqual(['code', 'message']);
});
test('rejects malformed JSON, wrong content type and invalid user identifier', async (): Promise<void> => {
  await request(app)
    .post('/api/v1/reservations')
    .set('Content-Type', 'application/json')
    .send('{')
    .expect(400);
  await request(app)
    .post('/api/v1/reservations')
    .type('text')
    .send('hello')
    .expect(400);
  await request(app).get('/api/v1/reservations/user/%20').expect(400);
});
test('HTTP concurrency admits one booking and rejects the rest', async (): Promise<void> => {
  const results = await Promise.all(
    Array.from({ length: 6 }, () =>
      request(app).post('/api/v1/reservations').send(payload),
    ),
  );
  expect(results.filter((result) => result.status === 201)).toHaveLength(1);
  expect(results.filter((result) => result.status === 409)).toHaveLength(5);
});
test('unexpected service errors return a sanitized 500 response', async (): Promise<void> => {
  class FailingService extends ReservationService {
    override async create(
      _input: CreateReservationRequest,
    ): Promise<Reservation> {
      throw new Error('private database credentials');
    }
  }
  const result = await request(createApp(new FailingService()))
    .post('/api/v1/reservations')
    .send(payload)
    .expect(500);
  expect(result.body).toEqual({
    code: 'INTERNAL_ERROR',
    message: 'Internal server error.',
  });
});

test('cancellation is idempotent, retains history, and permits rebooking', async (): Promise<void> => {
  const created = await request(app)
    .post('/api/v1/reservations')
    .send(payload)
    .expect(201);
  const id: string = created.body.id;
  const cancelled = await request(app)
    .patch(`/api/v1/reservations/${id}/cancel`)
    .expect(200);
  expect(cancelled.body.status).toBe('CANCELLED');
  const repeated = await request(app)
    .patch(`/api/v1/reservations/${id}/cancel`)
    .expect(200);
  expect(repeated.body).toEqual(cancelled.body);
  const history = await request(app)
    .get(`/api/v1/reservations/user/${payload.userId}`)
    .expect(200);
  expect(history.body).toEqual([cancelled.body]);
  await request(app).post('/api/v1/reservations').send(payload).expect(201);
  await request(app).patch('/api/v1/reservations/missing/cancel').expect(400);
  await request(app).patch('/api/v1/reservations/%20/cancel').expect(400);
});
test('resource availability and combined filters use the current API contract', async (): Promise<void> => {
  const unavailable = await request(app)
    .get('/api/v1/resources?isAvailable=false')
    .expect(200);
  expect(unavailable.body).toEqual([
    expect.objectContaining({ id: 'res-103', isAvailable: false }),
  ]);
  const room = await request(app)
    .get('/api/v1/resources?type=ROOM&isAvailable=true')
    .expect(200);
  expect(room.body).toEqual([expect.objectContaining({ id: 'res-101' })]);
  for (const query of [
    'isAvailable=',
    'isAvailable=1',
    'isAvailable=true&isAvailable=false',
  ]) {
    await request(app).get(`/api/v1/resources?${query}`).expect(400);
  }
});
