import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logActivity } from '../utils/activity-logger';

export const getNotesByProject = async (
  projectId: string,
  page: number = 1,
  limit: number = 20
) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new AppError(404, 'Project not found');
  }

  const [data, total] = await Promise.all([
    prisma.progressNote.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.progressNote.count({ where: { projectId } }),
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

export const createNote = async (
  projectId: string,
  content: string,
  userId: string
) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new AppError(404, 'Project not found');
  }

  const note = await prisma.progressNote.create({
    data: {
      projectId,
      content,
      createdBy: userId,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Update project's last_note and last_updated_at
  await prisma.project.update({
    where: { id: projectId },
    data: {
      lastNote: content,
      lastUpdatedAt: new Date(),
    },
  });

  await logActivity({
    projectId,
    action: 'note_added',
    description: `Progress note added to "${project.name}"`,
    newValue: content.substring(0, 200),
    performedBy: userId,
  });

  return note;
};

export const updateNote = async (
  noteId: string,
  content: string,
  userId: string
) => {
  const existing = await prisma.progressNote.findUnique({
    where: { id: noteId },
  });

  if (!existing) {
    throw new AppError(404, 'Note not found');
  }

  const note = await prisma.progressNote.update({
    where: { id: noteId },
    data: { content },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // If this was the last note, update project's last_note
  const project = await prisma.project.findUnique({
    where: { id: existing.projectId },
  });

  if (project && project.lastNote === existing.content) {
    await prisma.project.update({
      where: { id: existing.projectId },
      data: { lastNote: content, lastUpdatedAt: new Date() },
    });
  }

  await logActivity({
    projectId: existing.projectId,
    action: 'note_updated',
    description: `Progress note updated`,
    oldValue: existing.content.substring(0, 200),
    newValue: content.substring(0, 200),
    performedBy: userId,
  });

  return note;
};

export const deleteNote = async (noteId: string, userId: string) => {
  const existing = await prisma.progressNote.findUnique({
    where: { id: noteId },
  });

  if (!existing) {
    throw new AppError(404, 'Note not found');
  }

  await prisma.progressNote.delete({ where: { id: noteId } });

  await logActivity({
    projectId: existing.projectId,
    action: 'note_deleted',
    description: `Progress note deleted`,
    oldValue: existing.content.substring(0, 200),
    performedBy: userId,
  });

  return { message: 'Note deleted successfully' };
};
