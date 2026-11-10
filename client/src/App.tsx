import { useState, type FormEvent } from 'react';
import type { Resource } from './api/campushubApi';
import { ResourceList } from './components/ResourceList';
import { BookingForm } from './components/BookingForm';
import { UserReservations } from './components/UserReservations';
export default function App() {
  const [userId, setUserId] = useState('student-001');
  const [draft, setDraft] = useState(userId);
  const [identityError, setIdentityError] = useState('');
  const [selected, setSelected] = useState<Resource | null>(null);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');
  function changeUser(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const value = draft.trim();
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(value)) {
      setIdentityError('Use 1–100 letters, numbers, underscores or hyphens.');
      return;
    }
    setIdentityError('');
    setUserId(value);
    setSelected(null);
    setNotice('');
  }
  return (
    <>
      <header>
        <a className="brand" href="#">
          <span className="brand-icon">c.</span>CampusHub
        </a>
        <a href="#bookings">My bookings ↗</a>
      </header>
      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">YOUR CAMPUS. YOUR POSSIBILITIES.</p>
            <h1>
              Good things start
              <br />
              with a little <em>space.</em>
            </h1>
            <p>
              Find the right room, gear up for your next project,
              <br className="desktop" /> and make more of your time on campus.
            </p>
          </div>
          <div className="hero-graphic" aria-hidden="true">
            <div className="arch">
              <span>
                MAKE
                <br />
                ROOM.
              </span>
              <i>↗</i>
            </div>
            <span className="graphic-caption">
              A place for your next big idea.
            </span>
          </div>
        </section>
        <form className="identity" onSubmit={changeUser}>
          <label htmlFor="student">Student ID</label>
          <input
            id="student"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={100}
            required
          />
          <button type="submit">Use student ID</button>
          <span className="muted">
            Current: {userId} · Lab demo, no sign-in
          </span>
          {identityError && <span role="alert">{identityError}</span>}
        </form>
        {notice && (
          <p className="success" role="status">
            {notice}
          </p>
        )}
        <ResourceList
          onSelect={(resource) => {
            setSelected(resource);
            setNotice('');
          }}
        />
        {selected && (
          <BookingForm
            key={selected.id + userId}
            resource={selected}
            userId={userId}
            onClose={() => setSelected(null)}
            onBooked={() => {
              setSelected(null);
              setRevision((n) => n + 1);
              setNotice(
                'Reservation confirmed. You can find it in My bookings.',
              );
            }}
          />
        )}
        <div id="bookings">
          <UserReservations key={userId} userId={userId} revision={revision} />
        </div>
      </main>
      <footer>
        <span className="brand">CampusHub</span>
        <span>A little space. A lot of potential.</span>
        <span>CS 5500 · Lab 5</span>
      </footer>
    </>
  );
}
