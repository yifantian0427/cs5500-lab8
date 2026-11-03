import { initializeApp } from './app.js';
import { loadEnvironment } from './config/environment.js';
import { disconnectDatabase } from './config/database.js';
async function main(): Promise<void> {
  const { port } = loadEnvironment();
  const app = await initializeApp();
  const server = app.listen(port, (): void => {
    process.stdout.write(`CampusHub API listening on port ${port}\n`);
  });
  server.on('error', (error: Error): void => {
    console.error(error.message);
    void disconnectDatabase().finally((): void => {
      process.exitCode = 1;
    });
  });
  const shutdown = (): void => {
    server.close((): void => {
      void disconnectDatabase().catch((error: unknown): void => {
        console.error(error);
        process.exitCode = 1;
      });
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
void main().catch((error: unknown): void => {
  console.error(error instanceof Error ? error.message : 'Startup failed.');
  process.exitCode = 1;
});
