import { useState, type FormEvent } from 'react';
import {
  ApiError,
  createReservation,
  errorMessage,
  type Resource,
} from '../api/campushubApi';
interface BookingFormProps {
  resource: Resource;
  userId: string;
  onBooked: () => void;
  onClose: () => void;
}
export function BookingForm({
  resource,
  userId,
  onBooked,
  onClose,
}: BookingFormProps) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (isLoading) return;
    setError('');
    if (
      !start ||
      !end ||
      !Number.isFinite(Date.parse(start)) ||
      !Number.isFinite(Date.parse(end))
    ) {
      setError('Choose a valid start and end time.');
      return;
    }
    if (Date.parse(end) <= Date.parse(start)) {
      setError('End time must be after start time.');
      return;
    }
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(userId)) {
      setError('Enter a valid student ID before booking.');
      return;
    }
    setIsLoading(true);
    try {
      await createReservation({
        resourceId: resource.id,
        userId,
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
      });
      onBooked();
    } catch (e: unknown) {
      setError(
        e instanceof ApiError && e.status === 409
          ? 'This resource is already reserved for the selected time window. Please choose another time.'
          : errorMessage(e),
      );
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <section className="booking-panel" aria-labelledby="booking-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR NEXT RESERVATION</p>
          <h2 id="booking-title">Book {resource.name}</h2>
        </div>
        <button
          disabled={isLoading}
          onClick={onClose}
          aria-label="Close booking form"
        >
          ✕
        </button>
      </div>
      <p>
        Booking as <strong>{userId}</strong> · {resource.location}
      </p>
      <form
        onSubmit={(e) => {
          void submit(e);
        }}
      >
        <div className="time-fields">
          <label>
            Start time
            <input
              autoFocus
              type="datetime-local"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
              disabled={isLoading}
            />
          </label>
          <label>
            End time
            <input
              type="datetime-local"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              disabled={isLoading}
            />
          </label>
        </div>
        <p className="muted">
          Times are in your local timezone:{' '}
          {Intl.DateTimeFormat().resolvedOptions().timeZone}.
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary" disabled={isLoading} type="submit">
          {isLoading ? 'Reserving…' : 'Confirm reservation'}
        </button>
      </form>
    </section>
  );
}
