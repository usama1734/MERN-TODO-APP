import express from 'express';
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
  getTodoStats,
} from '../controllers/todoControllers';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/todos', requireAuth, getTodos);
router.get('/todos/stats', requireAuth, getTodoStats);
router.post('/todos', requireAuth, createTodo);
router.put('/todos/:id', requireAuth, updateTodo);
router.patch('/todos/:id/toggle', requireAuth, toggleTodo);
router.delete('/todos/:id', requireAuth, deleteTodo);

export default router;
