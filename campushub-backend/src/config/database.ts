import mongoose from 'mongoose';
export async function connectDatabase(uri: string): Promise<void> {
  mongoose.set('bufferCommands', false);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    const hello: unknown = await mongoose.connection.db
      ?.admin()
      .command({ hello: 1 });
    if (
      typeof hello !== 'object' ||
      hello === null ||
      (!('setName' in hello) && !('msg' in hello && hello.msg === 'isdbgrid'))
    )
      throw new Error(
        'MongoDB must be a replica set or sharded cluster for booking transactions.',
      );
  } catch (error: unknown) {
    await mongoose.disconnect();
    throw error;
  }
}
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
