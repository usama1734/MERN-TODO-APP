import { useState, useEffect } from "react";
import Modal from "../components/Modal";
import { Todo } from "../types";
import { fetchTodos, createTodo, updateTodo, deleteTodo } from "../services/TodoService";
import '../styles/global.css';

const HomePage = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

    useEffect(() => {
        fetchTodos().then(setTodos);
    }, []);

    const openModal = (todo?: Todo) => {
        setSelectedTodo(todo || null);
        setShowModal(true);
    };

    const closeModal = () => {
        setSelectedTodo(null);
        setShowModal(false);
    };

    const handleAddOrUpdate = (todo: Todo) => {
        console.log("todo", todo)
        if (!todo._id) {
            createTodo(todo).then(newTodo => setTodos([...todos, newTodo]));
        } else {
            updateTodo(todo).then(updatedTodo => {
                setTodos(todos.map(t => (t._id === updatedTodo._id ? updatedTodo : t)));
            });
        }
    };

    const handleDelete = (id: number) => {
        deleteTodo(id).then(() => setTodos(todos.filter(todo => todo._id !== id)));
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center p-10">
            <div className="w-full flex justify-between items-center mb-10">
                <h1 className="text-5xl font-bold text-white text-center">
                    Todo App
                </h1>
                <button
                    onClick={() => openModal()}
                    className="mb-20px bg-gradient-to-r from-teal-400 to-teal-600 text-white p-4 rounded-full shadow-lg hover:from-teal-500 hover:to-teal-700 transition duration-300 cursor-pointer"
                >
                    Add New Todo
                </button>
            </div>

            <div className="w-full max-w-6xl mx-auto overflow-x-auto">
                <table className="min-w-[60vw] table-auto bg-white shadow-lg rounded-2xl overflow-hidden mb-10">
                    <thead className="bg-gray-100">
                        <tr className="text-gray-700">
                            <th className="py-4 px-6 text-left font-semibold" >Title</th>
                            <th className="py-4 px-6 text-left font-semibold" >Description</th>
                            <th className="py-4 px-6 text-center font-semibold" >Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {todos.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="py-4 px-6 text-center text-gray-500">
                                    No Data Available
                                </td>
                            </tr>
                        ) : (
                            todos.map((todo, index) => (
                                <tr key={todo._id} className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                                    <td className="py-4 px-6">{todo.title}</td>
                                    <td className="py-4 px-6" >{todo.description}</td>
                                    <td className="py-4 px-6 flex justify-center space-x-4" >
                                        <button
                                            onClick={() => openModal(todo)}
                                            className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 px-4 rounded-full transition duration-300 cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(todo._id)}
                                            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-full transition duration-300 cursor-pointer"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {
                showModal && (
                    <Modal closeModal={closeModal} todo={selectedTodo || undefined} onSubmit={handleAddOrUpdate} />
                )
            }
        </div >
    );
};

export default HomePage;