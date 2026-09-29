import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createApp } from '../app.js';
import { ReservationService } from '../services/reservation.service.js';
import type {
  Reservation,
  CreateReservationRequest,
} from '../types/reservation.js';
import {
  UserModel,
  ResourceModel,
  ReservationModel,
} from '../models/domain.models.js';

const payload: CreateReservationRequest = {
  resourceId: 'res-101',
  userId: 'user-456',
  startTime: '2026-10-01T10:00:00Z',
  endTime: '2026-10-01T11:00:00Z',
};
test('HTTP contract: resources, creation, conflicts, active lookup and validation', async (): Promise<void> => {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
  async function post(body: unknown): Promise<Response> {
    return fetch(`${base}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  try {
    const resources = await fetch(`${base}/resources`);
    assert.equal(resources.status, 200);
    assert.equal(((await resources.json()) as unknown[]).length, 3);
    const filtered = await fetch(`${base}/resources?type=ROOM`);
    assert.equal(filtered.status, 200);
    assert.equal(((await filtered.json()) as unknown[]).length, 1);
    for (const query of ['type=', 'type=STUDY_ROOM', 'type=ROOM&type=LAB'])
      assert.equal((await fetch(`${base}/resources?${query}`)).status, 400);
    const created = await post(payload);
    assert.equal(created.status, 201);
    const reservation = (await created.json()) as Reservation;
    assert.deepEqual(
      Object.keys(reservation).sort(),
      ['id', 'resourceId', 'userId', 'startTime', 'endTime', 'status'].sort(),
    );
    assert.equal(reservation.status, 'CONFIRMED');
    for (const times of [
      payload,
      {
        ...payload,
        startTime: '2026-10-01T09:30:00Z',
        endTime: '2026-10-01T10:30:00Z',
      },
      {
        ...payload,
        startTime: '2026-10-01T10:15:00Z',
        endTime: '2026-10-01T10:45:00Z',
      },
      {
        ...payload,
        startTime: '2026-10-01T09:00:00Z',
        endTime: '2026-10-01T12:00:00Z',
      },
      {
        ...payload,
        startTime: '2026-10-01T12:00:00+02:00',
        endTime: '2026-10-01T13:00:00+02:00',
      },
    ]) {
      const conflict = await post(times);
      assert.equal(conflict.status, 409);
      assert.deepEqual(await conflict.json(), {
        code: 'DOUBLE_BOOKING',
        message: 'Resource is already reserved for this time slot.',
      });
    }
    assert.equal(
      (
        await post({
          ...payload,
          startTime: payload.endTime,
          endTime: '2026-10-01T12:00:00Z',
        })
      ).status,
      201,
    );
    assert.equal(
      (await post({ ...payload, resourceId: 'res-102' })).status,
      201,
    );
    const mine = await fetch(`${base}/reservations/user/user-456`);
    assert.equal(mine.status, 200);
    assert.equal(((await mine.json()) as unknown[]).length, 3);
    assert.deepEqual(
      await (await fetch(`${base}/reservations/user/unknown`)).json(),
      [],
    );
    assert.equal((await fetch(`${base}/reservations/user/%20`)).status, 400);
    for (const body of [
      {},
      null,
      [],
      { ...payload, userId: '' },
      { ...payload, status: 'CONFIRMED' },
      { ...payload, resourceId: 'missing' },
      { ...payload, resourceId: 'res-103' },
      { ...payload, endTime: payload.startTime },
      { ...payload, endTime: '2026-10-01T09:00:00Z' },
      ...[
        '2026-02-30T10:00:00Z',
        '2026-10-01T25:00:00Z',
        '2026-10-01T10:00:00',
        'not a date',
        '2026-10-01T10:00:00+25:00',
      ].map((startTime) => ({ ...payload, startTime })),
    ]) {
      const result = await post(body);
      assert.equal(result.status, 400);
      assert.deepEqual(Object.keys((await result.json()) as object).sort(), [
        'code',
        'message',
      ]);
    }
    const malformed = await fetch(`${base}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    assert.equal(malformed.status, 400);
    const batch = await Promise.all(
      Array.from({ length: 8 }, (): Promise<Response> =>
        post({
          ...payload,
          startTime: '2026-10-02T10:00:00Z',
          endTime: '2026-10-02T11:00:00Z',
        }),
      ),
    );
    assert.equal(batch.filter((r) => r.status === 201).length, 1);
    assert.equal(batch.filter((r) => r.status === 409).length, 7);
  } finally {
    await new Promise<void>((resolve, reject): void => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
test('pending blocks bookings; cancelled is excluded and does not block', (): void => {
  const pending: Reservation = { ...payload, id: 'pending', status: 'PENDING' };
  const cancelled: Reservation = {
    ...payload,
    id: 'cancelled',
    status: 'CANCELLED',
  };
  const service = new ReservationService(undefined, [pending, cancelled]);
  assert.deepEqual(service.listUserReservations(payload.userId), [pending]);
  assert.throws((): Reservation => service.create(payload), {
    code: 'DOUBLE_BOOKING',
  });
  assert.equal(
    new ReservationService(undefined, [cancelled]).create(payload).status,
    'CONFIRMED',
  );
});
test('500 response hides internal exception details', async (): Promise<void> => {
  class FailingService extends ReservationService {
    override create(_input: CreateReservationRequest): Reservation {
      throw new Error('private details');
    }
  }
  const server = createApp(new FailingService()).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/reservations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    });
  } finally {
    await new Promise<void>((resolve, reject): void => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
test('Mongoose models validate without a database', (): void => {
  assert.equal(
    new UserModel({ id: 'user-456', name: 'Sample Student' }).validateSync(),
    undefined,
  );
  assert.equal(
    new ResourceModel({
      id: 'res-101',
      name: 'Room',
      type: 'ROOM',
      location: 'Library',
      isAvailable: true,
    }).validateSync(),
    undefined,
  );
  assert.equal(
    new ReservationModel({
      ...payload,
      id: 'r-1',
      status: 'CONFIRMED',
    }).validateSync(),
    undefined,
  );
  assert.ok(
    new ResourceModel({ id: 'res-1', type: 'STUDY_ROOM' }).validateSync(),
  );
  assert.ok(
    new ReservationModel({
      ...payload,
      id: 'r-1',
      status: 'INVALID',
    }).validateSync(),
  );
});
