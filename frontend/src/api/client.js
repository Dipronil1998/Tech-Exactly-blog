/**
 * Frontend API Client with auto token refresh on 401
 */
const API_BASE = '/api';

export const getStoredToken = () => localStorage.getItem('blog_access_token');
export const setStoredToken = (token) => {
  if (token) localStorage.setItem('blog_access_token', token);
  else localStorage.removeItem('blog_access_token');
};

export const getStoredRefreshToken = () => localStorage.getItem('blog_refresh_token');
export const setStoredRefreshToken = (token) => {
  if (token) localStorage.setItem('blog_refresh_token', token);
  else localStorage.removeItem('blog_refresh_token');
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('blog_user'));
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) localStorage.setItem('blog_user', JSON.stringify(user));
  else localStorage.removeItem('blog_user');
};

export const clearStoredAuth = () => {
  setStoredToken(null);
  setStoredRefreshToken(null);
  setStoredUser(null);
};

// Refresh access token using refresh token
export const refreshToken = async () => {
  const token = getStoredRefreshToken();

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token }),
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.data?.accessToken) {
    clearStoredAuth();
    throw new Error(data.message || 'Session expired');
  }

  setStoredToken(data.data.accessToken);
  if (data.data.refreshToken) {
    setStoredRefreshToken(data.data.refreshToken);
  }

  return data.data.accessToken;
};

// Generic API request with auto-retry on 401
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
    credentials: 'include',
  });

  // If 401 (access token expired), refresh token and retry the request once
  if (response.status === 401 && !options._retry && !endpoint.includes('/auth/')) {
    try {
      const newToken = await refreshToken();
      return request(endpoint, {
        ...options,
        _retry: true,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    } catch (err) {
      clearStoredAuth();
      throw err;
    }
  }

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

  refreshToken,

  getMe: () => request('/auth/me'),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: getStoredRefreshToken() }),
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
  getPosts: (params = '') => {
    if (params && typeof params === 'object') {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          qs.append(key, val);
        }
      });
      const str = qs.toString();
      return request(`/posts${str ? `?${str}` : ''}`);
    }
    return request(`/posts${params ? `?${params}` : ''}`);
  },
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
