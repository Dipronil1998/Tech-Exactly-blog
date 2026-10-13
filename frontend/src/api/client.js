/**
 * Frontend API Client with Bearer token authentication, credentials support,
 * automatic refresh token rotation & retry on token expiration (401).
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

export const clearStoredAuth = () => {
  setStoredToken(null);
  setStoredRefreshToken(null);
  setStoredUser(null);
};

// Single-flight refresh token mutex promise to avoid race conditions with token rotation
let refreshPromise = null;

export function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const storedRefreshToken = getStoredRefreshToken();

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(storedRefreshToken && { 'x-refresh-token': storedRefreshToken }),
      },
      body: JSON.stringify({
        refreshToken: storedRefreshToken || undefined,
      }),
      credentials: 'include', // sends HTTP-only refresh cookie if present
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success || !data.data?.accessToken) {
      clearStoredAuth();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('blog:session_expired', {
            detail: { message: data.message || 'Session expired. Please log in again.' },
          })
        );
      }
      const error = new Error(data.message || 'Failed to refresh access token.');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    const { accessToken, refreshToken: newRefreshToken } = data.data;
    setStoredToken(accessToken);
    if (newRefreshToken) {
      setStoredRefreshToken(newRefreshToken);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('blog:token_refreshed', {
          detail: { accessToken, refreshToken: newRefreshToken },
        })
      );
    }

    return accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

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

  // If 401 Unauthorized occurs on an authenticated route and hasn't been retried yet,
  // attempt to refresh the access token and replay the request.
  const isAuthRoute =
    endpoint.startsWith('/auth/login') ||
    endpoint.startsWith('/auth/register') ||
    endpoint.startsWith('/auth/refresh');

  if (response.status === 401 && !options._isRetry && !isAuthRoute) {
    const newToken = await refreshAccessToken();
    return request(endpoint, {
      ...options,
      _isRetry: true,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      },
    });
  }

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

  refreshToken: (token) =>
    token
      ? request('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: token }),
        })
      : refreshAccessToken(),

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
