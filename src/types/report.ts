export interface HighPriorityTask {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  isOverdue: boolean;
  assignedTo: string;
  assignee: { id: string; name: string; email: string } | null;
}

export interface ProjectReport {
  projectId: string;
  projectName: string;
  totalTasks: number;
  byStatus: {
    todo: number;
    in_progress: number;
    done: number;
  };
  overdueCount: number;
  completionRate: number;
  highPriorityUnresolved: HighPriorityTask[];
}
