import { connectDatabase, disconnectDatabase } from './config/database.js';
import { loadEnvironment } from './config/environment.js';
import { seedResources } from './services/seed.service.js';
async function main(): Promise<void> {
  await connectDatabase(loadEnvironment().mongoUri);
  try {
    await seedResources();
    process.stdout.write('Sample resources seeded.\n');
  } finally {
    await disconnectDatabase();
  }
}
void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
