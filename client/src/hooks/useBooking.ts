import { useState, type Dispatch, type SetStateAction } from 'react';
import { ApiError, createReservation, errorMessage } from '../api/campushubApi';
interface BookingOptions {
  resourceId: string;
  userId: string;
  onBooked: () => void;
}
interface BookingState {
  start: string;
  end: string;
  setStart: Dispatch<SetStateAction<string>>;
  setEnd: Dispatch<SetStateAction<string>>;
  isLoading: boolean;
  error: string;
  submit: () => Promise<void>;
}
export function useBooking({
  resourceId,
  userId,
  onBooked,
}: BookingOptions): BookingState {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(): Promise<void> {
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
        resourceId,
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
  return { start, end, setStart, setEnd, isLoading, error, submit };
}
