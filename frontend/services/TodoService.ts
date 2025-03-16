import axios from "axios";
import { Todo } from "../types";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/todos";

export const fetchTodos = async (): Promise<Todo[]> => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching todos: ", error);
        throw new Error("Failed to fetch todos. Please try again later.");
    }
};

export const createTodo = async (todo: Todo): Promise<Todo> => {
    const response = await axios.post(API_URL, todo);
    return response.data;
};

export const updateTodo = async (todo: Todo): Promise<Todo> => {
    const response = await axios.put(`${API_URL}/${todo._id}`, todo);
    return response.data;
};

export const deleteTodo = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};
