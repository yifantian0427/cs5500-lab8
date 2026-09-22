import type { ErrorRequestHandler } from 'express';

export interface ErrorResponse {
  error: string;
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
): void => {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Unknown error'}\n`,
  );
  response
    .status(500)
    .json({ error: 'Internal server error' } satisfies ErrorResponse);
};
