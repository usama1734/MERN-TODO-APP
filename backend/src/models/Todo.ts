import mongoose, { Schema, Document } from 'mongoose';

interface ITodo extends Document {
    title: string;
    description: string;
    completed: boolean;
}

const TodoSchema = new Schema<ITodo>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        completed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Todo = mongoose.model<ITodo>('Todo', TodoSchema);

export default Todo;
