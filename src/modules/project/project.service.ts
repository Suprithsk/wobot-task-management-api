import prisma from '../../config/prisma';
import { CreateProjectInput, UpdateProjectInput } from '../../types/project';

export const createProject = async (ownerId: string, input: CreateProjectInput) => {
  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      ownerId,
    },
  });
};

export const getAllProjects = async (ownerId: string) => {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getProjectById = async (id: string, ownerId: string) => {
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) return null;
  if (project.ownerId !== ownerId) throw new Error('FORBIDDEN');

  return project;
};

export const updateProject = async (id: string, ownerId: string, input: UpdateProjectInput) => {
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) return null;
  if (project.ownerId !== ownerId) throw new Error('FORBIDDEN');

  return prisma.project.update({
    where: { id },
    data: input,
  });
};

export const deleteProject = async (id: string, ownerId: string) => {
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) return null;
  if (project.ownerId !== ownerId) throw new Error('FORBIDDEN');

  await prisma.project.delete({ where: { id } });
  return true;
};
