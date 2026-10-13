/**
 * Frontend API Client with Bearer token authentication & credentials support
 */
const API_BASE = '/api';

export const getStoredToken = () => localStorage.getItem('blog_access_token');
export const setStoredToken = (token) => {
  if (token) localStorage.setItem('blog_access_token', token);
  else localStorage.removeItem('blog_access_token');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('blog_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) localStorage.setItem('blog_user', JSON.stringify(user));
  else localStorage.removeItem('blog_user');
};

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // enables cookies for refresh token
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth endpoints
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getMe: () => request('/auth/me'),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  // Admin Dashboard Metrics
  getAdminStats: () => request('/admin/stats'),

  // User Management
  getUsers: (params = '') => request(`/users${params ? `?${params}` : ''}`),
  updateUserRole: (id, role) =>
    request(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  deleteUser: (id) =>
    request(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Post Management
  getPosts: (params = '') => request(`/posts${params ? `?${params}` : ''}`),
  getPost: (idOrSlug) => request(`/posts/${idOrSlug}`),
  createPost: (postData) =>
    request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    }),
  updatePost: (id, postData) =>
    request(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    }),
  deletePost: (id, hardDelete = false) =>
    request(`/posts/${id}${hardDelete ? '?hardDelete=true' : ''}`, {
      method: 'DELETE',
    }),
  restorePost: (id) =>
    request(`/posts/${id}/restore`, {
      method: 'PATCH',
    }),

  // Comments
  getComments: (postId, params = '') =>
    request(`/posts/${postId}/comments${params ? `?${params}` : ''}`),
  createComment: (postId, commentData) =>
    request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    }),
  getAdminComments: (params = '') => request(`/admin/comments${params ? `?${params}` : ''}`),
  deleteComment: (id) =>
    request(`/comments/${id}`, {
      method: 'DELETE',
    }),
};
