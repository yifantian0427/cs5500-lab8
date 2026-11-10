import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { ResourceModel } from '../models/Resource.model.js';
import { ReservationModel } from '../models/Reservation.model.js';
import { seedResources } from '../services/seed.service.js';
let database: MongoMemoryReplSet | undefined;
beforeAll(async (): Promise<void> => {
  database = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  await mongoose.connect(database.getUri(), { dbName: 'campushub_lab7_test' });
  await Promise.all([ResourceModel.init(), ReservationModel.init()]);
});
beforeEach(async (): Promise<void> => {
  await ReservationModel.deleteMany({});
  await ResourceModel.deleteMany({});
  await seedResources();
});
afterAll(async (): Promise<void> => {
  await mongoose.disconnect();
  await database?.stop();
});
