import { useEffect, useRef, useState } from 'react';
import {
  cancelReservation,
  errorMessage,
  fetchUserReservations,
  type Reservation,
} from '../api/campushubApi';
interface ReservationsState {
  active: Reservation[];
  isLoading: boolean;
  error: string;
  cancelling: string | null;
  refresh: () => void;
  cancel: (id: string) => Promise<void>;
}
export function useReservations(
  userId: string,
  revision: number,
): ReservationsState {
  const [items, setItems] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    const version = ++generation.current;
    setCancelling(null);
    const current = (): boolean => generation.current === version;
    setIsLoading(true);
    setError('');
    setItems([]);
    fetchUserReservations(userId)
      .then((data) => {
        if (current()) setItems(data);
      })
      .catch((e: unknown) => {
        if (current()) setError(errorMessage(e));
      })
      .finally(() => {
        if (current()) setIsLoading(false);
      });
    return () => {
      generation.current += 1;
    };
  }, [userId, revision, retry]);
  async function cancel(id: string): Promise<void> {
    if (cancelling !== null) return;
    const version = generation.current;
    setCancelling(id);
    setError('');
    try {
      const updated = await cancelReservation(id);
      if (generation.current !== version) return;
      setItems((previous) =>
        previous.map((item) => (item.id === id ? updated : item)),
      );
      setRetry((n) => n + 1);
    } catch (e: unknown) {
      if (generation.current === version) setError(errorMessage(e));
    } finally {
      if (generation.current === version) setCancelling(null);
    }
  }
  const active = items
    .filter((item) => item.status !== 'CANCELLED')
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  return {
    active,
    isLoading,
    error,
    cancelling,
    refresh: () => setRetry((n) => n + 1),
    cancel,
  };
}
