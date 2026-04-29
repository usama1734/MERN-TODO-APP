import axios from "axios";
import { Todo } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/todos";
const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export interface TodoListResponse {
  items: Todo[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type TodoQueryParams = {
  page?: number;
  limit?: number;
  completed?: boolean;
  q?: string;
  sortBy?: "createdAt" | "title" | "completed";
  order?: "asc" | "desc";
};

export const fetchTodos = async (
  token: string,
  params?: TodoQueryParams
): Promise<TodoListResponse> => {
  try {
    const response = await axios.get(API_URL, {
      ...authHeaders(token),
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        ...(params?.completed !== undefined ? { completed: params.completed } : {}),
        ...(params?.q ? { q: params.q } : {}),
        ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
        ...(params?.order ? { order: params.order } : {}),
      },
    });
    const payload = response.data as Partial<TodoListResponse> | Todo[];
    if (Array.isArray(payload)) {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 10;
      return {
        items: payload,
        meta: {
          total: payload.length,
          page,
          limit,
          totalPages: Math.max(Math.ceil(payload.length / limit), 1),
        },
      };
    }

    return {
      items: payload.items ?? [],
      meta: {
        total: payload.meta?.total ?? payload.items?.length ?? 0,
        page: payload.meta?.page ?? (params?.page ?? 1),
        limit: payload.meta?.limit ?? (params?.limit ?? 10),
        totalPages: payload.meta?.totalPages ?? 1,
      },
    };
  } catch (error) {
    console.error("Error fetching todos: ", error);
    throw new Error("Failed to fetch todos. Please try again later.");
  }
};

export const createTodo = async (todo: Todo, token: string): Promise<Todo> => {
  const response = await axios.post(API_URL, {
    title: todo.title,
    description: todo.description,
    completed: todo.completed ?? false,
  }, authHeaders(token));
  return response.data;
};

export const updateTodo = async (todo: Todo, token: string): Promise<Todo> => {
  if (!todo._id) {
    throw new Error("Todo id is required for update.");
  }
  const response = await axios.put(`${API_URL}/${todo._id}`, todo, authHeaders(token));
  return response.data;
};

export const deleteTodo = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, authHeaders(token));
};
