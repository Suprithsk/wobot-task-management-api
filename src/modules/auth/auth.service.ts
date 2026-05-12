import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import { RegisterInput, LoginInput, AuthPayload } from '../../types/auth';

const SALT_ROUNDS = 12;

export const registerUser = async (input: RegisterInput): Promise<AuthPayload> => {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new Error('Email already in use');
  }

  const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await User.create({
    name: input.name,
    email: input.email,
    password_hash,
  });

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  const token = jwt.sign({ userId: user._id.toString() }, secret, { expiresIn: '7d' });

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
  };
};

export const loginUser = async (input: LoginInput): Promise<AuthPayload> => {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(input.password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  const token = jwt.sign({ userId: user._id.toString() }, secret, { expiresIn: '7d' });

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
  };
};
