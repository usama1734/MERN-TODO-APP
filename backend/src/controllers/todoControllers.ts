import { Request, Response } from 'express';
import Todo from '../models/Todo';

export const getTodos = async (req: Request, res: Response) => {
    try {
        const todos = await Todo.find();
        res.status(200).json(todos);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching todos' });
    }
};

export const createTodo = async (req: Request, res: Response) => {
    try {
        const { title, description } = req.body;
        const newTodo = new Todo({
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
        const { id } = req.params;
        const { title, description, completed } = req.body;
        const updatedTodo = await Todo.findByIdAndUpdate(id, { title, description, completed }, { new: true });
        res.status(200).json(updatedTodo);
    } catch (error) {
        res.status(500).json({ message: 'Error updating todo' });
    }
};

export const deleteTodo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Todo.findByIdAndDelete(id);
        res.status(200).json({ message: 'Todo deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting todo' });
    }
};
