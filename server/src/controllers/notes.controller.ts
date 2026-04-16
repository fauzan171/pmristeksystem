import { Context } from 'hono';
import * as notesService from '../services/notes.service';

export const getNotesByProject = async (c: Context) => {
  const { page = '1', limit = '20' } = c.req.query();
  const result = await notesService.getNotesByProject(c.req.param('projectId')!, parseInt(page, 10), parseInt(limit, 10));
  return c.json({ status: 'success', ...result });
};

export const createNote = async (c: Context) => {
  const user = c.get('user');
  const body = c.get('validatedBody');
  const note = await notesService.createNote(c.req.param('projectId')!, body.content, user.id);
  return c.json({ status: 'success', data: note }, 201);
};

export const updateNote = async (c: Context) => {
  const user = c.get('user');
  const body = c.get('validatedBody');
  const note = await notesService.updateNote(c.req.param('noteId')!, body.content, user.id);
  return c.json({ status: 'success', data: note });
};

export const deleteNote = async (c: Context) => {
  const user = c.get('user');
  const result = await notesService.deleteNote(c.req.param('noteId')!, user.id);
  return c.json({ status: 'success', data: result });
};
