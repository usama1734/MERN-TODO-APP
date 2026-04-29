import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Todo from '../models/Todo';

interface InMemoryTodo {
  _id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
}

const fallbackDataDir = path.resolve(__dirname, '../../.local-data');
const fallbackTodosFile = path.join(fallbackDataDir, 'todos.json');
if (!fs.existsSync(fallbackDataDir)) {
  fs.mkdirSync(fallbackDataDir, { recursive: true });
}
const loadInMemoryTodos = (): InMemoryTodo[] => {
  try {
    if (!fs.existsSync(fallbackTodosFile)) return [];
    const raw = fs.readFileSync(fallbackTodosFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InMemoryTodo[]) : [];
  } catch {
    return [];
  }
};
const saveInMemoryTodos = (todos: InMemoryTodo[]) => {
  fs.writeFileSync(fallbackTodosFile, JSON.stringify(todos, null, 2), 'utf-8');
};

const inMemoryTodos: InMemoryTodo[] = loadInMemoryTodos();

const isMongoConnected = () => mongoose.connection.readyState === 1;
const getAuthUserId = (req: Request) => (req as Request & { user?: { userId?: string } }).user?.userId;
const parseBooleanQuery = (value?: string) => {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const applyFilters = (todos: InMemoryTodo[], query: Request['query']) => {
  const status = parseBooleanQuery(query.completed as string | undefined);
  const q = ((query.q as string | undefined) || '').trim().toLowerCase();
  const sortBy = ((query.sortBy as string | undefined) || 'createdAt').toLowerCase();
  const sortOrder = ((query.order as string | undefined) || 'desc').toLowerCase();
  const page = Math.max(parseInt((query.page as string) || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt((query.limit as string) || '20', 10), 1), 100);

  let filtered = [...todos];

  if (status !== undefined) {
    filtered = filtered.filter((todo) => todo.completed === status);
  }

  if (q) {
    filtered = filtered.filter(
      (todo) =>
        todo.title.toLowerCase().includes(q) ||
        (todo.description || '').toLowerCase().includes(q),
    );
  }

  if (sortBy === 'title') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'completed') {
    filtered.sort((a, b) => Number(a.completed) - Number(b.completed));
  } else {
    // in-memory fallback has no createdAt; keep insertion order as default
  }

  if (sortOrder === 'desc') filtered.reverse();

  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return { items, meta: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) } };
};

export const getTodos = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const completed = parseBooleanQuery(req.query.completed as string | undefined);
    const q = ((req.query.q as string | undefined) || '').trim();
    const sortBy = ((req.query.sortBy as string | undefined) || 'createdAt').toLowerCase();
    const order = ((req.query.order as string | undefined) || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '20', 10), 1), 100);

    if (!isMongoConnected()) {
      const scopedTodos = inMemoryTodos.filter((todo) => todo.userId === userId);
      const result = applyFilters(scopedTodos, req.query);
      res.status(200).json(result);
      return;
    }

    const query: Record<string, unknown> = { userId };
    if (completed !== undefined) query.completed = completed;
    if (q) query.$or = [{ title: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];

    const sortMap: Record<string, 1 | -1> = {};
    if (sortBy === 'title') sortMap.title = order as 1 | -1;
    else if (sortBy === 'completed') sortMap.completed = order as 1 | -1;
    else sortMap.createdAt = order as 1 | -1;

    const [todos, total] = await Promise.all([
      Todo.find(query)
        .sort(sortMap)
        .skip((page - 1) * limit)
        .limit(limit),
      Todo.countDocuments(query),
    ]);

    res.status(200).json({
      items: todos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching todos' });
  }
};

export const getTodoStats = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    if (!isMongoConnected()) {
      const scoped = inMemoryTodos.filter((todo) => todo.userId === userId);
      const completed = scoped.filter((todo) => todo.completed).length;
      const pending = scoped.length - completed;
      res.status(200).json({ total: scoped.length, completed, pending });
      return;
    }

    const [total, completed] = await Promise.all([
      Todo.countDocuments({ userId }),
      Todo.countDocuments({ userId, completed: true }),
    ]);
    res.status(200).json({ total, completed, pending: total - completed });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching todo stats' });
  }
};

export const createTodo = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const { title, description } = req.body;
    if (!isMongoConnected()) {
      const newTodo: InMemoryTodo = {
        _id: randomUUID(),
        userId,
        title,
        description: description || '',
        completed: false,
      };
      inMemoryTodos.push(newTodo);
      saveInMemoryTodos(inMemoryTodos);
      res.status(201).json(newTodo);
      return;
    }
    const newTodo = new Todo({
      userId,
      title,
      description,
    });
    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error creating todo' });
  }
};

export const updateTodo = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const { id } = req.params;
    const { title, description, completed } = req.body;
    if (!isMongoConnected()) {
      const todoIndex = inMemoryTodos.findIndex((todo) => todo._id === id && todo.userId === userId);
      if (todoIndex === -1) {
        res.status(404).json({ message: 'Todo not found' });
        return;
      }
      inMemoryTodos[todoIndex] = {
        ...inMemoryTodos[todoIndex],
        title: title ?? inMemoryTodos[todoIndex].title,
        description: description ?? inMemoryTodos[todoIndex].description,
        completed: completed ?? inMemoryTodos[todoIndex].completed,
      };
      saveInMemoryTodos(inMemoryTodos);
      res.status(200).json(inMemoryTodos[todoIndex]);
      return;
    }
    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: id, userId },
      { title, description, completed },
      { new: true },
    );
    if (!updatedTodo) {
      res.status(404).json({ message: 'Todo not found' });
      return;
    }
    res.status(200).json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error updating todo' });
  }
};

export const deleteTodo = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const { id } = req.params;
    if (!isMongoConnected()) {
      const todoIndex = inMemoryTodos.findIndex((todo) => todo._id === id && todo.userId === userId);
      if (todoIndex === -1) {
        res.status(404).json({ message: 'Todo not found' });
        return;
      }
      inMemoryTodos.splice(todoIndex, 1);
      saveInMemoryTodos(inMemoryTodos);
      res.status(200).json({ message: 'Todo deleted' });
      return;
    }
    const deletedTodo = await Todo.findOneAndDelete({ _id: id, userId });
    if (!deletedTodo) {
      res.status(404).json({ message: 'Todo not found' });
      return;
    }
    res.status(200).json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting todo' });
  }
};

export const toggleTodo = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const { id } = req.params;

    if (!isMongoConnected()) {
      const todo = inMemoryTodos.find((item) => item._id === id && item.userId === userId);
      if (!todo) {
        res.status(404).json({ message: 'Todo not found' });
        return;
      }
      todo.completed = !todo.completed;
      saveInMemoryTodos(inMemoryTodos);
      res.status(200).json(todo);
      return;
    }

    const existing = await Todo.findOne({ _id: id, userId });
    if (!existing) {
      res.status(404).json({ message: 'Todo not found' });
      return;
    }

    existing.completed = !existing.completed;
    await existing.save();
    res.status(200).json(existing);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling todo' });
  }
};
