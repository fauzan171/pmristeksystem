import { Hono } from 'hono';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { updateSettingsSchema } from '../validators/settings.schema';

const router = new Hono();
router.use('*', authMiddleware);
router.get('/', getSettings);
router.put('/', validate(updateSettingsSchema), updateSettings);
export default router;
