import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import App from './App';
import { UserReservations } from './components/UserReservations';
import { BookingForm } from './components/BookingForm';
import { ResourceList } from './components/ResourceList';
import {
  ApiError,
  cancelReservation,
  createReservation,
  fetchResources,
  fetchUserReservations,
  type Resource,
} from './api/campushubApi';
const resource: Resource = {
  id: 'res-101',
  name: 'Study Room 302',
  type: 'ROOM',
  location: 'Library',
  isAvailable: true,
};
const reservation = {
  id: 'booking-1',
  resourceId: 'res-101',
  userId: 'student-001',
  startTime: '2026-11-01T10:00:00Z',
  endTime: '2026-11-01T11:00:00Z',
  status: 'CONFIRMED',
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('API contract', () => {
  it('uses the exact routes, verbs, payload and type query', async () => {
    const fetcher = vi.fn().mockImplementation(async () => json([]));
    vi.stubGlobal('fetch', fetcher);
    await fetchResources('ROOM');
    await fetchUserReservations('student-001');
    await createReservation({
      resourceId: 'res-101',
      userId: 'student-001',
      startTime: reservation.startTime,
      endTime: reservation.endTime,
    });
    await cancelReservation('booking-1');
    expect(fetcher.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/resources?type=ROOM',
      '/api/v1/reservations/user/student-001',
      '/api/v1/reservations',
      '/api/v1/reservations/booking-1/cancel',
    ]);
    expect(fetcher.mock.calls[2][1].method).toBe('POST');
    expect(JSON.parse(fetcher.mock.calls[2][1].body)).not.toHaveProperty(
      'status',
    );
    expect(fetcher.mock.calls[3][1].method).toBe('PATCH');
  });
  it('preserves conflict errors and recovers network failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          json({ code: 'CONFLICT', message: 'Overlap' }, 409),
        )
        .mockRejectedValueOnce(new TypeError('offline')),
    );
    await expect(fetchResources()).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
    await expect(fetchResources()).rejects.toBeInstanceOf(ApiError);
  });
});
function fillTimes(start = '2026-11-01T10:00', end = '2026-11-01T11:00'): void {
  fireEvent.change(screen.getByLabelText('Start time'), {
    target: { value: start },
  });
  fireEvent.change(screen.getByLabelText('End time'), {
    target: { value: end },
  });
}
describe('student workflows', () => {
  it('validates end time without dispatching', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    render(
      <BookingForm
        resource={resource}
        userId="student-001"
        onBooked={() => {}}
        onClose={() => {}}
      />,
    );
    fillTimes('2026-11-01T11:00', '2026-11-01T10:00');
    fireEvent.click(screen.getByText('Confirm reservation'));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'End time must be after',
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('shows an explicit 409 alert and clears the pending state', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(json({ code: 'CONFLICT', message: 'Overlap' }, 409)),
    );
    render(
      <BookingForm
        resource={resource}
        userId="student-001"
        onBooked={() => {}}
        onClose={() => {}}
      />,
    );
    fillTimes();
    fireEvent.click(screen.getByText('Confirm reservation'));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'already reserved',
    );
    expect(
      (screen.getByText('Confirm reservation') as HTMLButtonElement).disabled,
    ).toBe(false);
  });
  it('creates, refreshes bookings, and cancels through the dashboard', async () => {
    let booked = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string, init?: RequestInit) => {
        if (input.endsWith('/resources')) return json([resource]);
        if (init?.method === 'POST') {
          booked = true;
          return json(reservation, 201);
        }
        if (init?.method === 'PATCH') {
          booked = false;
          return json({ ...reservation, status: 'CANCELLED' });
        }
        return json(booked ? [reservation] : []);
      }),
    );
    render(<App />);
    fireEvent.click(await screen.findByText('Reserve resource'));
    fillTimes();
    fireEvent.click(screen.getByText('Confirm reservation'));
    await screen.findByText(
      'Reservation confirmed. You can find it in My bookings.',
    );
    fireEvent.click(await screen.findByText('Cancel reservation'));
    await waitFor(() =>
      expect(screen.queryByText('Cancel reservation')).toBeNull(),
    );
    await screen.findByText('A little room for possibility.');
  });
  it('ignores stale filter responses', async () => {
    let resolveOld: (value: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<Response>((resolve) => {
              resolveOld = resolve;
            }),
        )
        .mockResolvedValue(
          json([{ ...resource, id: 'lab', type: 'LAB', name: 'New lab' }]),
        ),
    );
    render(<ResourceList onSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Labs' }));
    await screen.findByText('New lab');
    resolveOld(json([resource]));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText('Study Room 302')).toBeNull();
  });
  it('offers retry after resource read failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValue(json([resource])),
    );
    render(<ResourceList onSelect={() => {}} />);
    await screen.findByRole('alert');
    fireEvent.click(screen.getByText('Retry'));
    await screen.findByText('Study Room 302');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('reservation request ownership', () => {
  it('ignores a cancellation failure after switching students', async () => {
    let finishCancellation: (value: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string, init?: RequestInit) => {
        if (init?.method === 'PATCH')
          return new Promise<Response>((resolve) => {
            finishCancellation = resolve;
          });
        return Promise.resolve(
          json([
            {
              ...reservation,
              userId: input.includes('student-002')
                ? 'student-002'
                : 'student-001',
            },
          ]),
        );
      }),
    );
    const { rerender } = render(
      <UserReservations userId="student-001" revision={0} />,
    );
    fireEvent.click(await screen.findByText('Cancel reservation'));
    rerender(<UserReservations userId="student-002" revision={0} />);
    await waitFor(() =>
      expect(
        (screen.getByText('Cancel reservation') as HTMLButtonElement).disabled,
      ).toBe(false),
    );
    await act(async () => {
      finishCancellation(json({ message: 'Old cancellation failed' }, 500));
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(
      (screen.getByText('Cancel reservation') as HTMLButtonElement).disabled,
    ).toBe(false);
  });
});
