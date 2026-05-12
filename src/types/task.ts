import { Request } from 'express';

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignedTo: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface TaskFilters {
  projectId?: string;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
}

export interface AssigneeInfo {
  id: string;
  name: string;
  email: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
}

export interface TaskWithAssignee {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: string;
  dueDate: Date | null;
  isOverdue: boolean;
  projectId: string;
  project: ProjectInfo;
  createdAt: Date;
  updatedAt: Date;
  assignee: AssigneeInfo | null;
  owner: AssigneeInfo | null;
}

export interface TaskRequest extends Request {
  user: {
    userId: string;
  };
}
