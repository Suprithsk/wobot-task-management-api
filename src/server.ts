import 'dotenv/config';
import app from './app';
import connectMongo from './config/mongo';
import prisma from './config/prisma';
import { startOverdueJob } from './jobs/overdueTask.job';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectMongo();
    await prisma.$connect();
    console.log('PostgreSQL (Prisma) connected successfully');

    startOverdueJob();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
