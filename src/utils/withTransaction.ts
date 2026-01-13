import mongoose, { ClientSession } from 'mongoose';

const withTransaction = async <T>(handler: (session: ClientSession) => Promise<T>): Promise<T> => {
  const session = await mongoose.startSession();

  try {
    let result!: T;

    await session.withTransaction(async () => {
      result = await handler(session);
    });

    return result;
  } finally {
    session.endSession();
  }
};

export default withTransaction;
