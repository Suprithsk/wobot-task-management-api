import { Request, Response } from 'express';
import { TaskRequest, TaskFilters } from '../../types/task';
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from './task.service';

export const create = async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as TaskRequest).user;
  const { projectId, title, description, priority, assignedTo, dueDate } = req.body as {
    projectId: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    assignedTo: string;
    dueDate?: string;
  };

  if (!projectId || !title || !assignedTo) {
    res.status(400).json({ success: false, message: 'projectId, title and assignedTo are required' });
    return;
  }

  try {
    const task = await createTask(userId, { projectId, title, description, priority, assignedTo, dueDate });

    if (!task) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') {
      res.status(403).json({ success: false, message: 'Only the project owner can create tasks' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
  const { status, priority, assignedTo, projectId } = req.query as Partial<TaskFilters>;

  try {
    const tasks = await getAllTasks({ status, priority, assignedTo, projectId });
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;

  try {
    const task = await getTaskById(id);

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as TaskRequest).user;
  const id = req.params['id'] as string;
  const { title, description, status, priority, dueDate } = req.body as {
    title?: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
  };

  try {
    const task = await updateTask(id, userId, { title, description, status, priority, dueDate });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') {
      res.status(403).json({ success: false, message: 'Only the assigned user can update this task' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as TaskRequest).user;
  const id = req.params['id'] as string;

  try {
    const result = await deleteTask(id, userId);

    if (!result) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') {
      res.status(403).json({ success: false, message: 'Only the project owner can delete tasks' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};
