import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/library';

export async function connectDb() {
  await mongoose.connect(uri);
  return mongoose.connection;
}

export { mongoose };
