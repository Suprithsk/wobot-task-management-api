import { Request } from 'express';

export interface AuthRequest extends Request {
  user: {
    userId: string;
  };
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}
