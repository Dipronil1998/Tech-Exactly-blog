import { createContext, useContext, useState, useEffect } from 'react';
import {
  api,
  getStoredToken,
  setStoredToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
  getStoredUser,
  setStoredUser,
  clearStoredAuth,
} from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('blog_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('blog_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync token state on refresh or session expiration events
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
    };

    const handleTokenRefreshed = (e) => {
      if (e.detail?.accessToken) {
        setToken(e.detail.accessToken);
      }
    };

    window.addEventListener('blog:session_expired', handleSessionExpired);
    window.addEventListener('blog:token_refreshed', handleTokenRefreshed);

    return () => {
      window.removeEventListener('blog:session_expired', handleSessionExpired);
      window.removeEventListener('blog:token_refreshed', handleTokenRefreshed);
    };
  }, []);

  // Verify current session with /api/auth/me on mount (handles auto-refresh if token expired)
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = getStoredToken();
      const storedRefresh = getStoredRefreshToken();

      // If no tokens exist at all, skip verification
      if (!storedToken && !storedRefresh) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.getMe();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          setStoredUser(response.data.user);
          setToken(getStoredToken());
        }
      } catch (err) {
        console.warn('Session verification failed, signing out', err.message);
        clearStoredAuth();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.login({
      email: identifier.includes('@') ? identifier : undefined,
      username: !identifier.includes('@') ? identifier : undefined,
      password,
    });

    if (res.success && res.data) {
      const { user: userData, accessToken, refreshToken } = res.data;
      setUser(userData);
      setToken(accessToken);
      setStoredToken(accessToken);
      if (refreshToken) {
        setStoredRefreshToken(refreshToken);
      }
      setStoredUser(userData);
      return userData;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Logout API error:', e.message);
    } finally {
      clearStoredAuth();
      setUser(null);
      setToken(null);
    }
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.data) {
      const { user: userDataRes, accessToken, refreshToken } = res.data;
      setUser(userDataRes);
      setToken(accessToken);
      setStoredToken(accessToken);
      if (refreshToken) {
        setStoredRefreshToken(refreshToken);
      }
      setStoredUser(userDataRes);
      return userDataRes;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
