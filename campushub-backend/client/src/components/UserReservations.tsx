import { useEffect, useState } from 'react';
import {
  cancelReservation,
  errorMessage,
  fetchUserReservations,
  type Reservation,
} from '../api/campushubApi';
interface UserReservationsProps {
  userId: string;
  revision: number;
}
export function UserReservations({ userId, revision }: UserReservationsProps) {
  const [items, setItems] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [cancelling, setCancelling] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    setIsLoading(true);
    setError('');
    setItems([]);
    fetchUserReservations(userId)
      .then((data) => {
        if (current) setItems(data);
      })
      .catch((e: unknown) => {
        if (current) setError(errorMessage(e));
      })
      .finally(() => {
        if (current) setIsLoading(false);
      });
    return () => {
      current = false;
    };
  }, [userId, revision, retry]);
  async function cancel(id: string): Promise<void> {
    setCancelling(id);
    setError('');
    try {
      const updated = await cancelReservation(id);
      setItems((previous) =>
        previous.map((item) => (item.id === id ? updated : item)),
      );
      setRetry((n) => n + 1);
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setCancelling(null);
    }
  }
  const active = items
    .filter((item) => item.status !== 'CANCELLED')
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  return (
    <section className="my-bookings" aria-labelledby="bookings-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PLAN AHEAD</p>
          <h2 id="bookings-title">My bookings</h2>
        </div>
        <button
          disabled={isLoading || cancelling !== null}
          onClick={() => setRetry((n) => n + 1)}
        >
          Refresh ↻
        </button>
      </div>
      {isLoading && <p role="status">Loading your reservations…</p>}
      {error && (
        <p className="error" role="alert">
          {error} <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </p>
      )}
      {!isLoading && !error && active.length === 0 && (
        <div className="empty">
          <h3>A little room for possibility.</h3>
          <p>
            Your active reservations will appear here. Find a resource above to
            get started.
          </p>
        </div>
      )}
      {active.map((item) => (
        <article className="reservation" key={item.id}>
          <div>
            <span className="status">{item.status}</span>
            <h3>{item.resourceId}</h3>
            <p>
              {new Date(item.startTime).toLocaleString()} →{' '}
              {new Date(item.endTime).toLocaleString()}
            </p>
          </div>
          <button
            disabled={cancelling !== null || isLoading}
            onClick={() => {
              void cancel(item.id);
            }}
          >
            {cancelling === item.id ? 'Cancelling…' : 'Cancel reservation'}
          </button>
        </article>
      ))}
    </section>
  );
}
