import { Request, Response } from 'express';
import { ProjectRequest } from '../../types/project';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from './project.service';

export const create = async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as ProjectRequest).user;
  const { name, description } = req.body as { name: string; description?: string };

  if (!name) {
    res.status(400).json({ success: false, message: 'name is required' });
    return;
  }

  try {
    const project = await createProject(userId, { name, description });
    res.status(201).json({ success: true, data: project });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as ProjectRequest).user;

  try {
    const projects = await getAllProjects(userId);
    res.status(200).json({ success: true, data: projects });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as ProjectRequest).user;
  const id = req.params['id'] as string;

  try {
    const project = await getProjectById(id, userId);

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as ProjectRequest).user;
  const id = req.params['id'] as string;
  const { name, description } = req.body as { name?: string; description?: string };

  try {
    const project = await updateProject(id, userId, { name, description });

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as ProjectRequest).user;
  const id = req.params['id'] as string;

  try {
    const result = await deleteProject(id, userId);

    if (!result) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
};
