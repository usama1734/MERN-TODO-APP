import axios from "axios";

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "http://localhost:5000/api/auth";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const signup = async (payload: { name: string; email: string; password: string }) => {
  const response = await axios.post<AuthResponse>(`${AUTH_API_URL}/signup`, payload);
  return response.data;
};

export const login = async (payload: { email: string; password: string }) => {
  const response = await axios.post<AuthResponse>(`${AUTH_API_URL}/login`, payload);
  return response.data;
};

export const saveSession = (token: string, user: AuthUser) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getToken = () => localStorage.getItem("token");

export const getCurrentUser = (): AuthUser | null => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const updateCurrentUser = (user: AuthUser) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const uploadProfileImage = async (token: string, imageFile: File): Promise<AuthUser> => {
  const imageBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
  const response = await axios.post<{ user: AuthUser }>(`${AUTH_API_URL}/profile-image`, { imageBase64 }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.user;
};
