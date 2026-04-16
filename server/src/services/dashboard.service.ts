import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export const getDashboardSummary = async () => {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalProjects,
    ongoingCount,
    planningCount,
    onHoldCount,
    completedCount,
    highPriorityCount,
    overdueProjects,
    deadlineAlerts,
    recentActivities,
    statusDistribution,
  ] = await Promise.all([
    // Total projects
    prisma.project.count(),

    // Status counts
    prisma.project.count({ where: { status: 'ongoing' } }),
    prisma.project.count({ where: { status: 'planning' } }),
    prisma.project.count({ where: { status: 'on_hold' } }),
    prisma.project.count({ where: { status: 'completed' } }),

    // High priority
    prisma.project.count({ where: { priority: 'high', status: { not: 'completed' } } }),

    // Overdue projects (deadline passed, not completed)
    prisma.project.findMany({
      where: {
        deadline: { lt: now },
        status: { not: 'completed' },
      },
      include: {
        pm: { select: { id: true, name: true, email: true } },
      },
      orderBy: { deadline: 'asc' },
    }),

    // Deadline alerts (within 7 days)
    prisma.project.findMany({
      where: {
        deadline: { gte: now, lte: sevenDaysFromNow },
        status: { not: 'completed' },
      },
      include: {
        pm: { select: { id: true, name: true, email: true } },
      },
      orderBy: { deadline: 'asc' },
    }),

    // Recent activities
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, projectCode: true } },
      },
    }),

    // Status distribution
    prisma.project.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ]);

  const atRiskCount = overdueProjects.length + highPriorityCount;

  return {
    totalProjects,
    ongoingCount,
    planningCount,
    onHoldCount,
    completedCount,
    atRiskCount,
    overdueCount: overdueProjects.length,
    highPriorityCount,
    statusDistribution: statusDistribution.map((item) => ({
      status: item.status,
      count: item._count.status,
    })),
    deadlineAlerts,
    overdueProjects,
    recentActivities,
  };
};
