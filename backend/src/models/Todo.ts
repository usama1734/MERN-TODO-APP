import mongoose, { Schema, Document } from 'mongoose';

interface ITodo extends Document {
    userId: string;
    title: string;
    description: string;
    completed: boolean;
}

const TodoSchema = new Schema<ITodo>(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        completed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Todo = mongoose.model<ITodo>('Todo', TodoSchema);

export default Todo;
