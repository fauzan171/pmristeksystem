import { Context } from 'hono';
import * as settingsService from '../services/settings.service';

export const getSettings = async (c: Context) => {
  const user = c.get('user');
  const settings = await settingsService.getSettings(user.id);
  return c.json({ status: 'success', data: settings });
};

export const updateSettings = async (c: Context) => {
  const user = c.get('user');
  const body = c.get('validatedBody');
  const settings = await settingsService.updateSettings(user.id, body);
  return c.json({ status: 'success', data: settings });
};
