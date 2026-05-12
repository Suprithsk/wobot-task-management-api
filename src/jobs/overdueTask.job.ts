import cron from 'node-cron';
import prisma from '../config/prisma';

export const startOverdueJob = (): void => {
  // Runs every minute — short interval for demo; change to '0 * * * *' for production
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log(`[OverdueJob] Tick at ${now.toISOString()} — checking tasks due before ${cutoff.toISOString()}`);

    try {
      const result = await prisma.task.updateMany({
        where: {
          dueDate: { lte: cutoff },
          status: { not: 'done' },
          isOverdue: false,
        },
        data: { isOverdue: true },
      });

      if (result.count > 0) {
        console.log(`[OverdueJob] Marked ${result.count} task(s) as overdue`);
      } else {
        console.log('[OverdueJob] No new overdue tasks found');
      }
    } catch (error) {
      console.error('[OverdueJob] Failed to update overdue tasks:', error);
    }
  });

  console.log('[OverdueJob] Scheduled — running every minute');
};
