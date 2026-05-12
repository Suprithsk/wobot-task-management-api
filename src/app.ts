import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cors());

// Health route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server running',
  });
});

// Routes
app.use('/api/auth', authRoutes);

export default app;
