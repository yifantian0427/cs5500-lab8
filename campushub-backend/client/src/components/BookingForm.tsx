import type { Resource } from '../api/campushubApi';
import { useBooking } from '../hooks/useBooking';
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
  const { start, end, setStart, setEnd, isLoading, error, submit } = useBooking(
    { resourceId: resource.id, userId, onBooked },
  );
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
          e.preventDefault();
          void submit();
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
