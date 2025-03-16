import { useState } from "react";
import { Todo } from "../types";

interface ModalProps {
    closeModal: () => void;
    todo?: Todo;
    onSubmit: (todo: Todo) => void;
}

const Modal: React.FC<ModalProps> = ({ closeModal, todo, onSubmit }) => {
    const [title, setTitle] = useState(todo?.title || "");
    const [description, setDescription] = useState(todo?.description || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const newTodo = { ...todo, title, description };
        onSubmit(newTodo as Todo);
        closeModal();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300">
                <h2 className="text-3xl font-semibold mb-8 text-center text-gray-800">
                    {todo ? "Edit Todo" : "Add New Todo"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-600 font-semibold mb-2">Title</label>
                        <input
                            type="text"
                            className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 transition-shadow duration-300"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter todo title"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 font-semibold mb-2">Description</label>
                        <textarea
                            className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 transition-shadow duration-300"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter todo description"
                            rows={4}
                        />
                    </div>

                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="bg-gray-500 text-white p-4 rounded-full hover:bg-gray-600 transition duration-300 font-semibold cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-teal-500 text-white p-4 rounded-full hover:bg-teal-600 transition duration-300 font-semibold cursor-pointer"
                        >
                            {todo ? "Update Todo" : "Add Todo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Modal;