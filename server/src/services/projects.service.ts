import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logActivity } from '../utils/activity-logger';
import { Prisma } from '@prisma/client';

interface GetAllProjectsFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const generateProjectCode = async (): Promise<string> => {
  const lastProject = await prisma.project.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { projectCode: true },
  });

  if (!lastProject) {
    return 'PRJ-001';
  }

  const lastNumber = parseInt(lastProject.projectCode.split('-')[1], 10);
  const nextNumber = lastNumber + 1;
  return `PRJ-${String(nextNumber).padStart(3, '0')}`;
};

export const getAllProjects = async (filters: GetAllProjectsFilters) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const where: Prisma.ProjectWhereInput = {};

  if (status) {
    where.status = status as any;
  }

  if (priority) {
    where.priority = priority as any;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { projectCode: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        pm: { select: { id: true, name: true, email: true } },
        _count: { select: { notes: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
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

export const getProjectById = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      pm: { select: { id: true, name: true, email: true } },
      notes: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      activityLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!project) {
    throw new AppError(404, 'Project not found');
  }

  return project;
};

export const createProject = async (
  data: {
    name: string;
    description?: string;
    priority?: string;
    startDate?: string | null;
    deadline: string;
    waGroupName?: string;
    waGroupId?: string;
  },
  pmId: string
) => {
  const projectCode = await generateProjectCode();

  const project = await prisma.project.create({
    data: {
      projectCode,
      name: data.name,
      description: data.description,
      priority: (data.priority as any) || 'medium',
      startDate: data.startDate ? new Date(data.startDate) : null,
      deadline: new Date(data.deadline),
      waGroupName: data.waGroupName,
      waGroupId: data.waGroupId,
      pmId,
    },
    include: {
      pm: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity({
    projectId: project.id,
    action: 'project_created',
    description: `Project "${project.name}" (${project.projectCode}) created`,
    newValue: JSON.stringify({ name: project.name, code: project.projectCode }),
    performedBy: pmId,
  });

  return project;
};

export const updateProject = async (
  projectId: string,
  data: {
    name?: string;
    description?: string;
    priority?: string;
    startDate?: string | null;
    deadline?: string;
    waGroupName?: string;
    waGroupId?: string;
  },
  userId: string
) => {
  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new AppError(404, 'Project not found');
  }

  const updateData: Prisma.ProjectUpdateInput = {};
  const changes: string[] = [];

  if (data.name !== undefined && data.name !== existing.name) {
    changes.push(`name: "${existing.name}" → "${data.name}"`);
    updateData.name = data.name;
  }

  if (data.description !== undefined && data.description !== existing.description) {
    updateData.description = data.description;
  }

  if (data.priority !== undefined && data.priority !== existing.priority) {
    changes.push(`priority: ${existing.priority} → ${data.priority}`);
    updateData.priority = data.priority as any;
  }

  if (data.startDate !== undefined) {
    const newDate = data.startDate ? new Date(data.startDate) : null;
    updateData.startDate = newDate;
  }

  if (data.deadline !== undefined) {
    updateData.deadline = new Date(data.deadline);
  }

  if (data.waGroupName !== undefined) {
    updateData.waGroupName = data.waGroupName;
  }

  if (data.waGroupId !== undefined) {
    updateData.waGroupId = data.waGroupId;
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: updateData,
    include: {
      pm: { select: { id: true, name: true, email: true } },
    },
  });

  if (changes.length > 0) {
    await logActivity({
      projectId,
      action: 'project_updated',
      description: `Project "${existing.name}" updated: ${changes.join(', ')}`,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(data),
      performedBy: userId,
    });
  }

  return project;
};

export const updateStatus = async (
  projectId: string,
  status: string,
  userId: string
) => {
  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new AppError(404, 'Project not found');
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { status: status as any },
    include: {
      pm: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity({
    projectId,
    action: 'status_changed',
    description: `Project "${existing.name}" status changed from ${existing.status} to ${status}`,
    oldValue: existing.status,
    newValue: status,
    performedBy: userId,
  });

  return project;
};

export const updateProgress = async (
  projectId: string,
  progress: number,
  userId: string
) => {
  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new AppError(404, 'Project not found');
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      progress,
      lastUpdatedAt: new Date(),
    },
    include: {
      pm: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity({
    projectId,
    action: 'progress_updated',
    description: `Project "${existing.name}" progress updated from ${existing.progress}% to ${progress}%`,
    oldValue: String(existing.progress),
    newValue: String(progress),
    performedBy: userId,
  });

  return project;
};

export const deleteProject = async (projectId: string, userId: string) => {
  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new AppError(404, 'Project not found');
  }

  await logActivity({
    projectId,
    action: 'project_deleted',
    description: `Project "${existing.name}" (${existing.projectCode}) deleted`,
    oldValue: JSON.stringify({ name: existing.name, code: existing.projectCode }),
    performedBy: userId,
  });

  await prisma.project.delete({ where: { id: projectId } });

  return { message: 'Project deleted successfully' };
};
