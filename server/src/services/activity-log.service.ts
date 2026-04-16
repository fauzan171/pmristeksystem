import prisma from '../config/database';
import { Prisma } from '@prisma/client';

interface GetActivityLogsFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  action?: string;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
}

export const getActivityLogs = async (filters: GetActivityLogsFilters) => {
  const {
    page = 1,
    limit = 20,
    projectId,
    action,
    performedBy,
    startDate,
    endDate,
  } = filters;

  const where: Prisma.ActivityLogWhereInput = {};

  if (projectId) {
    where.projectId = projectId;
  }

  if (action) {
    where.action = { contains: action, mode: 'insensitive' };
  }

  if (performedBy) {
    where.performedBy = performedBy;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      (where.createdAt as any).gte = new Date(startDate);
    }
    if (endDate) {
      (where.createdAt as any).lte = new Date(endDate);
    }
  }

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, projectCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getActivityStats = async () => {
  const [
    totalLogs,
    todayLogs,
    actionBreakdown,
    recentLogs,
  ] = await Promise.all([
    prisma.activityLog.count(),
    prisma.activityLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.activityLog.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    }),
    prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, projectCode: true } },
      },
    }),
  ]);

  return {
    totalLogs,
    todayLogs,
    actionBreakdown: actionBreakdown.map((item) => ({
      action: item.action,
      count: item._count.action,
    })),
    recentLogs,
  };
};
