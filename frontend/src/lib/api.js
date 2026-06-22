import { auth } from '../stores/auth.js';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function request(path, { method = 'GET', body, authed = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authed) {
    const token = auth.session.value?.access_token;
    if (!token) throw new Error('Not authenticated');
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  signup: (body)  => request('/auth/signup', { method: 'POST', body }),
  login:  (body)  => request('/auth/login',  { method: 'POST', body }),

  myTodos:    ()                 => request('/todos', { authed: true }),
  createTodo: (title)            => request('/todos', { method: 'POST', body: { title }, authed: true }),
  updateTodo: (id, patch)        => request(`/todos/${id}`, { method: 'PUT', body: patch, authed: true }),
  deleteTodo: (id)               => request(`/todos/${id}`, { method: 'DELETE', authed: true }),
  cloneTodo:  (id)               => request(`/todos/${id}/clone`, { method: 'POST', authed: true }),

  userTodos:  (username)         => request(`/users/${encodeURIComponent(username)}/todos`),
};
