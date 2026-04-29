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
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">{todo ? "Edit Todo" : "Add New Todo"}</h2>
          <p className="text-sm text-gray-500 mt-1">Fill in the details and save.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Title</label>
            <input
              type="text"
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 transition-shadow duration-300"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter todo title"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Description</label>
            <textarea
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 transition-shadow duration-300"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter todo description"
              rows={4}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-3 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition font-semibold"
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
