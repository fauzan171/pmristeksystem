import { Hono } from 'hono';
import { getNotesByProject, createNote, updateNote, deleteNote } from '../controllers/notes.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createNoteSchema, updateNoteSchema } from '../validators/note.schema';

const router = new Hono();
router.use('*', authMiddleware);
router.get('/', getNotesByProject);
router.post('/', validate(createNoteSchema), createNote);
router.put('/:noteId', validate(updateNoteSchema), updateNote);
router.delete('/:noteId', deleteNote);
export default router;
