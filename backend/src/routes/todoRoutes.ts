import express from 'express';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../controllers/todoControllers';

const router = express.Router();

router.get('/todos', getTodos);
router.post('/todos', createTodo);
router.put('/todos/:id', updateTodo);
router.delete('/todos/:id', deleteTodo);

export default router;
