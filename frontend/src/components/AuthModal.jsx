import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { X, User, Shield, ArrowRight } from 'lucide-react';

export const AuthModal = ({ isOpen, initialMode = 'login', onClose }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [adminSecret, setAdminSecret] = useState('super_secret_admin_key_for_blog_2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await register({
          username: username.trim(),
          name: name.trim() || undefined,
          email: identifier.trim(),
          password,
          role,
          adminSecret: role === 'admin' ? adminSecret : undefined,
        });
      } else {
        await login(identifier.trim(), password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication error. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for quick Demo Admin login/registration
  const handleDemoAdmin = async () => {
    setError('');
    setLoading(true);
    try {
      try {
        await login('admin@example.com', 'adminPassword123!');
      } catch {
        // If not created yet, create demo admin
        await api.register({
          username: 'admin',
          name: 'Chief Editor',
          email: 'admin@example.com',
          password: 'adminPassword123!',
          role: 'admin',
          adminSecret: 'super_secret_admin_key_for_blog_2026',
        });
        await login('admin@example.com', 'adminPassword123!');
      }
      onClose();
    } catch (err) {
      setError(`Demo login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper for quick Demo Writer login/registration
  const handleDemoWriter = async () => {
    setError('');
    setLoading(true);
    try {
      try {
        await login('writer@example.com', 'writerPassword123!');
      } catch {
        // If not created yet, create demo writer
        await api.register({
          username: 'elena_writer',
          name: 'Elena Rostova',
          email: 'writer@example.com',
          password: 'writerPassword123!',
          role: 'user',
        });
        await login('writer@example.com', 'writerPassword123!');
      }
      onClose();
    } catch (err) {
      setError(`Demo writer login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay animate-fade-in" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-tabs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            >
              Create Account
            </button>
          </div>

          <button onClick={onClose} className="auth-close-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="auth-modal-body">
          <h2 className="auth-heading">
            {mode === 'login' ? 'Welcome back.' : 'Join The Chronicle.'}
          </h2>
          <p className="auth-subheading">
            {mode === 'login'
              ? 'Enter your credentials to manage your stories and participate.'
              : 'Create a personal account to write, publish, and comment.'}
          </p>

          {error && <div className="auth-error-box">{error}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <>
                <div className="auth-form-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Elena Rostova"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="clean-input"
                  />
                </div>

                <div className="auth-form-field">
                  <label>Username</label>
                  <input
                    type="text"
                    placeholder="e.g. elenarostova"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="clean-input"
                    required
                  />
                </div>
              </>
            )}

            <div className="auth-form-field">
              <label>{mode === 'register' ? 'Email Address' : 'Email or Username'}</label>
              <input
                type={mode === 'register' ? 'email' : 'text'}
                placeholder={mode === 'register' ? 'name@example.com' : 'name@example.com or username'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="clean-input"
                required
              />
            </div>

            <div className="auth-form-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="clean-input"
                required
              />
            </div>

            {mode === 'register' && (
              <div className="auth-form-field">
                <label>Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="clean-input"
                >
                  <option value="user">Reader / Author (Standard)</option>
                  <option value="admin">Administrator</option>
                </select>
                {role === 'admin' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem' }}>Admin Secret Key</label>
                    <input
                      type="password"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      className="clean-input"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary auth-submit-btn"
            >
              <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Options */}
          <div className="auth-divider">
            <span>or use demo accounts</span>
          </div>

          <div className="demo-accounts-grid">
            <button
              type="button"
              onClick={handleDemoWriter}
              disabled={loading}
              className="demo-account-btn"
            >
              <User size={15} />
              <span>Continue as Demo Author</span>
            </button>

            <button
              type="button"
              onClick={handleDemoAdmin}
              disabled={loading}
              className="demo-account-btn"
            >
              <Shield size={15} />
              <span>Continue as Demo Admin</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .auth-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
        }

        .auth-modal {
          background: var(--bg-primary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          max-width: 460px;
          width: 100%;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .auth-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .auth-tabs {
          display: flex;
          gap: 1rem;
        }

        .auth-tab-btn {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-muted);
          padding-bottom: 0.25rem;
          position: relative;
        }

        .auth-tab-btn.active {
          color: var(--text-main);
          font-weight: 600;
        }

        .auth-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1rem;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--text-main);
        }

        .auth-close-btn {
          color: var(--text-muted);
          padding: 4px;
          border-radius: var(--radius-pill);
        }

        .auth-close-btn:hover {
          color: var(--text-main);
          background: var(--bg-subtle);
        }

        .auth-modal-body {
          padding: 2rem 1.75rem 2.25rem;
        }

        .auth-heading {
          font-family: var(--font-serif);
          font-size: 1.75rem;
          line-height: 1.25;
          margin-bottom: 0.4rem;
        }

        .auth-subheading {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }

        .auth-error-box {
          background: #ffebee;
          color: var(--accent-rose);
          padding: 0.65rem 0.85rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }

        .auth-form-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .auth-form-field label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .auth-submit-btn {
          width: 100%;
          justify-content: center;
          padding: 0.75rem;
          font-size: 0.95rem;
          margin-top: 0.5rem;
        }

        .auth-divider {
          text-align: center;
          margin: 1.75rem 0 1.25rem;
          position: relative;
        }

        .auth-divider::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: var(--border-subtle);
        }

        .auth-divider span {
          position: relative;
          background: var(--bg-primary);
          padding: 0 0.75rem;
          font-size: 0.75rem;
          color: var(--text-faint);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .demo-accounts-grid {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .demo-account-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--bg-subtle);
          color: var(--text-main);
          border: 1px solid var(--border-subtle);
          padding: 0.55rem 1rem;
          border-radius: var(--radius-pill);
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .demo-account-btn:hover:not(:disabled) {
          background: var(--bg-hover);
          border-color: var(--border-muted);
        }
      `}</style>
    </div>
  );
};
