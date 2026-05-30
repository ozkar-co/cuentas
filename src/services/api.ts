const BASE_URL = 'https://forja-api.onrender.com';
const JWT_KEY = 'cuentas_jwt';
const USER_KEY = 'cuentas_user';

export interface BackendUser {
  name: string;
  email: string;
  picture: string;
}

export const getToken = (): string | null => localStorage.getItem(JWT_KEY);
export const setToken = (token: string): void => localStorage.setItem(JWT_KEY, token);
export const clearToken = (): void => localStorage.removeItem(JWT_KEY);

export const getStoredUser = (): BackendUser | null => {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? (JSON.parse(stored) as BackendUser) : null;
};
export const setStoredUser = (user: BackendUser): void =>
  localStorage.setItem(USER_KEY, JSON.stringify(user));
export const clearStoredUser = (): void => localStorage.removeItem(USER_KEY);

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(err.message || `HTTP ${response.status}`);
  }

  const json = await response.json();
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
