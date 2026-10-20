export interface Environment {
  port: number;
  mongoUri: string;
}
export function loadEnvironment(): Environment {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be 1-65535.');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || !/^mongodb(\+srv)?:\/\//.test(mongoUri))
    throw new Error('Set MONGODB_URI to a MongoDB replica-set connection URI.');
  return { port, mongoUri };
}
