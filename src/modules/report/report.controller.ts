import { Request, Response } from 'express';
import { AuthRequest } from '../../types/auth';
import { getProjectReport } from './report.service';

export const getReport = async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const id = req.params['id'] as string;

  console.log(`[ReportController] GET /projects/${id}/report — user ${userId}`);

  try {
    const report = await getProjectReport(id, userId);

    if (!report) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    console.log(`[ReportController] Report generated successfully for project ${id}`);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'FORBIDDEN') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    console.error(`[ReportController] Failed to generate report for project ${id}:`, error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};
