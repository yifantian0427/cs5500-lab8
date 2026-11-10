import { ReservationService } from '../reservation.service.js';
import { ResourceService } from '../resource.service.js';
import { seedResources } from '../seed.service.js';
import { ResourceModel } from '../../models/Resource.model.js';
import { ReservationModel } from '../../models/Reservation.model.js';
import { payload } from '../../test/fixtures.js';
const service = new ReservationService();
test('creates resources idempotently and filters by resource type', async (): Promise<void> => {
  await seedResources();
  expect(await new ResourceService().listResources()).toHaveLength(3);
  expect(await new ResourceService().listResources('ROOM')).toEqual([
    expect.objectContaining({ id: 'res-101', type: 'ROOM' }),
  ]);
});
test('persists a valid reservation and lists it with its public resource ID', async (): Promise<void> => {
  const created = await service.create(payload);
  expect(created).toEqual({
    ...payload,
    id: expect.any(String),
    status: 'CONFIRMED',
  });
  expect(await service.listUserReservations(payload.userId)).toEqual([created]);
  expect(await service.listUserReservations('unknown')).toEqual([]);
});
test.each([
  ['exact match', payload.startTime, payload.endTime],
  [
    'one millisecond at start',
    '2026-11-10T09:00:00.000Z',
    '2026-11-10T10:00:00.001Z',
  ],
  [
    'one millisecond at end',
    '2026-11-10T10:59:59.999Z',
    '2026-11-10T12:00:00.000Z',
  ],
  ['contained', '2026-11-10T10:15:00.000Z', '2026-11-10T10:45:00.000Z'],
  ['enclosing', '2026-11-10T09:00:00.000Z', '2026-11-10T12:00:00.000Z'],
])('rejects overlap: %s', async (_label, startTime, endTime): Promise<void> => {
  await service.create(payload);
  await expect(
    service.create({ ...payload, startTime, endTime }),
  ).rejects.toMatchObject({ status: 409, code: 'DOUBLE_BOOKING' });
  expect(await ReservationModel.countDocuments()).toBe(1);
});
test.each([
  ['2026-11-10T09:00:00.000Z', payload.startTime],
  [payload.endTime, '2026-11-10T12:00:00.000Z'],
])(
  'allows adjacent interval %s to %s',
  async (startTime, endTime): Promise<void> => {
    await service.create(payload);
    await expect(
      service.create({ ...payload, startTime, endTime }),
    ).resolves.toMatchObject({ status: 'CONFIRMED' });
  },
);
test.each([payload.startTime, '2026-11-10T09:00:00Z', 'invalid'])(
  'rejects invalid end time %s',
  async (endTime): Promise<void> => {
    await expect(service.create({ ...payload, endTime })).rejects.toMatchObject(
      { code: 'VALIDATION_ERROR' },
    );
    expect(await ReservationModel.countDocuments()).toBe(0);
  },
);
test.each([
  ['missing', 'RESOURCE_NOT_FOUND'],
  ['res-103', 'RESOURCE_UNAVAILABLE'],
])('rejects resource %s', async (resourceId, code): Promise<void> => {
  await expect(
    service.create({ ...payload, resourceId }),
  ).rejects.toMatchObject({ code });
});
test('pending reservations block bookings; cancellation releases the slot and preserves history', async (): Promise<void> => {
  const created = await service.create(payload);
  await ReservationModel.updateOne({ id: created.id }, { status: 'PENDING' });
  await expect(service.create(payload)).rejects.toMatchObject({
    code: 'DOUBLE_BOOKING',
  });
  const cancelled = await service.cancel(created.id);
  expect(cancelled.status).toBe('CANCELLED');
  expect(await service.cancel(created.id)).toEqual(cancelled);
  expect(await service.listUserReservations(payload.userId)).toEqual([
    cancelled,
  ]);
  await expect(service.create(payload)).resolves.toMatchObject({
    status: 'CONFIRMED',
  });
});
test('independent service instances serialize concurrent booking attempts', async (): Promise<void> => {
  const results = await Promise.allSettled(
    Array.from({ length: 8 }, () => new ReservationService().create(payload)),
  );
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  const rejected = results.filter((result) => result.status === 'rejected');
  expect(rejected).toHaveLength(7);
  for (const result of rejected)
    expect(result.reason).toMatchObject({ code: 'DOUBLE_BOOKING' });
  expect(await ReservationModel.countDocuments()).toBe(1);
});
test('reports an orphaned resource reference', async (): Promise<void> => {
  await service.create(payload);
  await ResourceModel.deleteMany({});
  await expect(service.listUserReservations(payload.userId)).rejects.toThrow(
    'missing resource reference',
  );
});

test('cancellation rejects a missing reservation', async (): Promise<void> => {
  await expect(service.cancel('missing')).rejects.toMatchObject({
    code: 'RESERVATION_NOT_FOUND',
  });
});
test('cancellation reports a missing resource reference', async (): Promise<void> => {
  const created = await service.create(payload);
  await ResourceModel.deleteMany({});
  await expect(service.cancel(created.id)).rejects.toThrow(
    'missing resource reference',
  );
});
test('availability filters support false and combined criteria', async (): Promise<void> => {
  const resources = new ResourceService();
  expect(await resources.listResources(undefined, true)).toHaveLength(2);
  expect(await resources.listResources(undefined, false)).toEqual([
    expect.objectContaining({ id: 'res-103' }),
  ]);
  expect(await resources.listResources('ROOM', false)).toEqual([]);
});
