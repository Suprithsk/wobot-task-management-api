import prisma from '../../config/prisma';
import User from '../../models/User';
import { TaskStatus, TaskPriority } from '../../generated/prisma/client';
import { HighPriorityTask, ProjectReport } from '../../types/report';

export const getProjectReport = async (
  projectId: string,
  requesterId: string
): Promise<ProjectReport | null> => {
  console.log(`[ReportService] Fetching report for project ${projectId} by user ${requesterId}`);

  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project) {
    console.log(`[ReportService] Project ${projectId} not found`);
    return null;
  }

  if (project.ownerId !== requesterId) {
    console.log(`[ReportService] User ${requesterId} is not owner of project ${projectId}`);
    throw new Error('FORBIDDEN');
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      isOverdue: true,
      dueDate: true,
      assignedTo: true,
    },
  });

  console.log(`[ReportService] Found ${tasks.length} total task(s) for project ${projectId}`);

  // Status breakdown
  const byStatus = { todo: 0, in_progress: 0, done: 0 };
  for (const task of tasks) {
    if (task.status === TaskStatus.todo) byStatus.todo++;
    else if (task.status === TaskStatus.in_progress) byStatus.in_progress++;
    else if (task.status === TaskStatus.done) byStatus.done++;
  }

  const overdueCount = tasks.filter((t) => t.isOverdue).length;

  const completionRate =
    tasks.length === 0
      ? 0
      : Math.round((byStatus.done / tasks.length) * 100 * 10) / 10;

  // High-priority unresolved tasks
  const highPriorityUnresolved = tasks.filter(
    (t) => t.priority === TaskPriority.high && t.status !== TaskStatus.done
  );

  console.log(
    `[ReportService] High-priority unresolved: ${highPriorityUnresolved.length}, overdue: ${overdueCount}, completion: ${completionRate}%`
  );

  // Hydrate assignees from MongoDB in one batch query
  const assigneeIds = [...new Set(highPriorityUnresolved.map((t) => t.assignedTo))];

  const users = await User.find({ _id: { $in: assigneeIds } }).select('name email');
  console.log(`[ReportService] Resolved ${users.length} assignee(s) from MongoDB`);

  const userMap = new Map<string, { id: string; name: string; email: string }>();
  for (const u of users) {
    userMap.set(u._id.toString(), {
      id: u._id.toString(),
      name: u.name,
      email: u.email,
    });
  }

  const hydratedHighPriority: HighPriorityTask[] = highPriorityUnresolved.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    dueDate: t.dueDate,
    isOverdue: t.isOverdue,
    assignedTo: t.assignedTo,
    assignee: userMap.get(t.assignedTo) ?? null,
  }));

  return {
    projectId: project.id,
    projectName: project.name,
    totalTasks: tasks.length,
    byStatus,
    overdueCount,
    completionRate,
    highPriorityUnresolved: hydratedHighPriority,
  };
};
