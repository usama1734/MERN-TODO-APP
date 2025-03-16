import { Todo } from "../types";

const TodoItem = ({ todo, onEdit, onDelete }: { todo: Todo, onEdit: (todo: Todo) => void, onDelete: (id: number) => void }) => (
    <div className="p-4 bg-gray-100 rounded-md shadow-md">
        <h3 className="text-xl">{todo.title}</h3>
        <p>{todo.description}</p>
        <button onClick={() => onEdit(todo)} className="mt-2 bg-yellow-500 text-white p-2 rounded">Edit</button>
        <button onClick={() => onDelete(todo._id)} className="mt-2 bg-red-500 text-white p-2 rounded">Delete</button>
    </div>
);

export default TodoItem;
