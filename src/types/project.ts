import { Request } from 'express';

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export interface ProjectRequest extends Request {
  user: {
    userId: string;
  };
}
