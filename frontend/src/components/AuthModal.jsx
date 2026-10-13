import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogleFirebase } from '../config/firebase';
import { X, ArrowRight } from 'lucide-react';

export const AuthModal = ({ isOpen, initialMode = 'login', onClose }) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const firebaseUserData = await signInWithGoogleFirebase();
      await loginWithGoogle(firebaseUserData);
      onClose();
    } catch (err) {
      console.warn('Firebase Google Auth error:', err);
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request'
      ) {
        setGoogleLoading(false);
        return;
      }
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

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
            {mode === 'login' ? 'Welcome back.' : 'Join Blogger.'}
          </h2>
          <p className="auth-subheading">
            {mode === 'login'
              ? 'Enter your credentials to manage your stories and participate.'
              : 'Create a personal account to write, publish, and comment.'}
          </p>

          {error && <div className="auth-error-box">{error}</div>}

          {/* Firebase Google Sign In */}
          <div className="google-auth-section">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="google-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="google-icon">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

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
                      placeholder="Enter administrator secret key"
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
              disabled={loading || googleLoading}
              className="btn-primary auth-submit-btn"
            >
              <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
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

        .google-auth-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.7rem 1rem;
          border-radius: var(--radius-sm);
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .google-btn:hover:not(:disabled) {
          background: var(--bg-subtle);
          border-color: var(--border-strong);
        }

        .google-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .google-icon {
          flex-shrink: 0;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          margin: 1.25rem 0;
          text-align: center;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-subtle);
        }

        .auth-divider span {
          padding: 0 0.75rem;
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
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
      `}</style>
    </div>
  );
};
