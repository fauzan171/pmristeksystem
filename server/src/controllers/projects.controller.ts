import { Context } from 'hono';
import * as projectService from '../services/projects.service';

export const getAllProjects = async (c: Context) => {
  const { page = '1', limit = '10', status, priority, search, sortBy, sortOrder } = c.req.query();
  const result = await projectService.getAllProjects({
    page: parseInt(page, 10), limit: parseInt(limit, 10),
    status: status as string | undefined, priority: priority as string | undefined,
    search: search as string | undefined, sortBy: sortBy as string || 'createdAt',
    sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
  });
  return c.json({ status: 'success', ...result });
};

export const getProjectById = async (c: Context) => {
  const project = await projectService.getProjectById(c.req.param('id')!);
  return c.json({ status: 'success', data: project });
};

export const createProject = async (c: Context) => {
  const user = c.get('user');
  const body = c.get('validatedBody');
  const project = await projectService.createProject(body, user.id);
  return c.json({ status: 'success', data: project }, 201);
};

export const updateProject = async (c: Context) => {
  const user = c.get('user');
  const body = c.get('validatedBody');
  const project = await projectService.updateProject(c.req.param('id')!, body, user.id);
  return c.json({ status: 'success', data: project });
};

export const updateStatus = async (c: Context) => {
  const user = c.get('user');
  const body = c.get('validatedBody');
  const project = await projectService.updateStatus(c.req.param('id')!, body.status, user.id);
  return c.json({ status: 'success', data: project });
};

export const updateProgress = async (c: Context) => {
  const user = c.get('user');
  const body = c.get('validatedBody');
  const project = await projectService.updateProgress(c.req.param('id')!, body.progress, user.id);
  return c.json({ status: 'success', data: project });
};

export const deleteProject = async (c: Context) => {
  const user = c.get('user');
  const result = await projectService.deleteProject(c.req.param('id')!, user.id);
  return c.json({ status: 'success', data: result });
};
