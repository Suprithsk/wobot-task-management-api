import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import projectRoutes from './modules/project/project.routes';
import taskRoutes from './modules/task/task.routes';
import reportRoutes from './modules/report/report.routes';

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
app.use('/api/projects', projectRoutes);
app.use('/api/projects', reportRoutes);
app.use('/api/tasks', taskRoutes);

export default app;
