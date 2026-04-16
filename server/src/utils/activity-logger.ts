import prisma from '../config/database';

interface LogActivityParams {
  projectId?: string;
  action: string;
  description: string;
  oldValue?: string | null;
  newValue?: string | null;
  performedBy: string;
}

export const logActivity = async (params: LogActivityParams) => {
  return prisma.activityLog.create({
    data: {
      projectId: params.projectId || null,
      action: params.action,
      description: params.description,
      oldValue: params.oldValue || null,
      newValue: params.newValue || null,
      performedBy: params.performedBy,
    },
  });
};
