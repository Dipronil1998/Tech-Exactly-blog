import { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken, setStoredToken, getStoredUser, setStoredUser } from '../api/client';

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

  // Verify current session with /api/auth/me on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.getMe();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          setStoredUser(response.data.user);
        }
      } catch (err) {
        // Token expired or invalid
        console.warn('Session verification failed, signing out', err.message);
        setUser(null);
        setToken(null);
        setStoredToken(null);
        setStoredUser(null);
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
      const { user: userData, accessToken } = res.data;
      setUser(userData);
      setToken(accessToken);
      setStoredToken(accessToken);
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
      setUser(null);
      setToken(null);
      setStoredToken(null);
      setStoredUser(null);
    }
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.data) {
      const { user: userDataRes, accessToken } = res.data;
      setUser(userDataRes);
      setToken(accessToken);
      setStoredToken(accessToken);
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
