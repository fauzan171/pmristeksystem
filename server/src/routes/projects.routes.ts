import { Hono } from 'hono';
import { getAllProjects, getProjectById, createProject, updateProject, updateStatus, updateProgress, deleteProject } from '../controllers/projects.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createProjectSchema, updateProjectSchema, updateStatusSchema, updateProgressSchema } from '../validators/project.schema';

const router = new Hono();
router.use('*', authMiddleware);
router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.post('/', validate(createProjectSchema), createProject);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.patch('/:id/status', validate(updateStatusSchema), updateStatus);
router.patch('/:id/progress', validate(updateProgressSchema), updateProgress);
router.delete('/:id', deleteProject);
export default router;
