import prisma from '../../config/prisma';
import User from '../../models/User';
import { TaskStatus, TaskPriority, Prisma } from '../../generated/prisma/client';
import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskWithAssignee,
  AssigneeInfo,
} from '../../types/task';

type TaskWithProject = Prisma.TaskGetPayload<{ include: { project: true } }>;

const hydrateUsers = async (tasks: TaskWithProject[]): Promise<TaskWithAssignee[]> => {
  const ids = [
    ...new Set([
      ...tasks.map((t) => t.assignedTo),
      ...tasks.map((t) => t.project.ownerId),
    ]),
  ];

  const users = await User.find({ _id: { $in: ids } }).select('name email');

  const userMap = new Map<string, AssigneeInfo>();
  for (const u of users) {
    userMap.set(u._id.toString(), {
      id: u._id.toString(),
      name: u.name,
      email: u.email,
    });
  }

  return tasks.map((task) => ({
    ...task,
    assignee: userMap.get(task.assignedTo) ?? null,
    owner: userMap.get(task.project.ownerId) ?? null,
  }));
};

export const createTask = async (
  requesterId: string,
  input: CreateTaskInput
): Promise<TaskWithAssignee | null> => {
  const project = await prisma.project.findUnique({ where: { id: input.projectId } });

  if (!project) return null;
  if (project.ownerId !== requesterId) throw new Error('FORBIDDEN');

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      priority: (input.priority as TaskPriority) ?? TaskPriority.medium,
      assignedTo: input.assignedTo,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      projectId: input.projectId,
    },
    include: { project: true },
  });

  const [hydrated] = await hydrateUsers([task]);
  return hydrated;
};

export const getAllTasks = async (filters: TaskFilters): Promise<TaskWithAssignee[]> => {
  const tasks = await prisma.task.findMany({
    where: {
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.status && { status: filters.status as TaskStatus }),
      ...(filters.priority && { priority: filters.priority as TaskPriority }),
      ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
    },
    include: { project: true },
    orderBy: { createdAt: 'desc' },
  });

  return hydrateUsers(tasks);
};

export const getTaskById = async (id: string): Promise<TaskWithAssignee | null> => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!task) return null;

  const [hydrated] = await hydrateUsers([task]);
  return hydrated;
};

export const updateTask = async (
  id: string,
  requesterId: string,
  input: UpdateTaskInput
): Promise<TaskWithAssignee | null> => {
  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) return null;
  if (task.assignedTo !== requesterId) throw new Error('FORBIDDEN');

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status && { status: input.status as TaskStatus }),
      ...(input.priority && { priority: input.priority as TaskPriority }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      }),
    },
    include: { project: true },
  });

  const [hydrated] = await hydrateUsers([updated]);
  return hydrated;
};

export const deleteTask = async (id: string, requesterId: string): Promise<boolean | null> => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!task) return null;
  if (task.project.ownerId !== requesterId) throw new Error('FORBIDDEN');

  await prisma.task.delete({ where: { id } });
  return true;
};

