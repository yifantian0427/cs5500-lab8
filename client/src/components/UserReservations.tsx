import { useReservations } from '../hooks/useReservations';
interface UserReservationsProps {
  userId: string;
  revision: number;
}
export function UserReservations({ userId, revision }: UserReservationsProps) {
  const { active, isLoading, error, cancelling, refresh, cancel } =
    useReservations(userId, revision);
  return (
    <section className="my-bookings" aria-labelledby="bookings-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PLAN AHEAD</p>
          <h2 id="bookings-title">My bookings</h2>
        </div>
        <button disabled={isLoading || cancelling !== null} onClick={refresh}>
          Refresh ↻
        </button>
      </div>
      {isLoading && <p role="status">Loading your reservations…</p>}
      {error && (
        <p className="error" role="alert">
          {error} <button onClick={refresh}>Retry</button>
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
