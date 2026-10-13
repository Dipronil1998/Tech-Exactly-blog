import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { X, Lock, Mail, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [adminSecret, setAdminSecret] = useState('test_admin_secret_key_99999');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await api.register({
          username,
          email: identifier,
          password,
          role,
          adminSecret: role === 'admin' ? adminSecret : undefined,
        });
        // Auto-login after registration
        await login(identifier, password);
      } else {
        await login(identifier, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setIsRegister(false);
    setIdentifier('admin@example.com');
    setPassword('adminPassword123!');
    setError('');
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{isRegister ? 'Register New Account' : 'Admin Portal Login'}</h2>
            <p className="modal-subtitle">
              {isRegister
                ? 'Create an administrator or user profile'
                : 'Sign in to access the system administration panel'}
            </p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {isRegister && (
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. system_admin"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>{isRegister ? 'Email Address' : 'Email or Username'}</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                type={isRegister ? 'email' : 'text'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isRegister ? 'admin@example.com' : 'admin@example.com or admin_user'}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your secure password"
                required
              />
            </div>
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label>Account Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="admin">Administrator (Admin)</option>
                  <option value="user">Regular User</option>
                </select>
              </div>

              {role === 'admin' && (
                <div className="form-group">
                  <label>Admin Secret Key</label>
                  <div className="input-with-icon">
                    <KeyRound size={16} className="input-icon" />
                    <input
                      type="password"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      placeholder="Enter server ADMIN_SECRET_KEY"
                      required
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary full-width" disabled={loading}>
              {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="btn-secondary full-width fill-demo-btn"
            >
              <CheckCircle2 size={16} />
              Fill Demo Admin Credentials
            </button>
          </div>
        </form>

        <div className="modal-footer">
          <button
            type="button"
            className="toggle-mode-btn"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Need to create an account? Register here"}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .modal-content {
          max-width: 440px;
          width: 100%;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }
        .modal-title {
          font-size: 1.35rem;
          line-height: 1.2;
        }
        .modal-subtitle {
          font-size: 0.825rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
        .close-btn {
          background: transparent;
          color: var(--text-muted);
          padding: 0.25rem;
          border-radius: var(--radius-sm);
        }
        .close-btn:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.05);
        }
        .error-banner {
          background: rgba(244, 63, 94, 0.15);
          border: 1px solid rgba(244, 63, 94, 0.3);
          color: var(--accent-rose);
          padding: 0.625rem 0.875rem;
          border-radius: var(--radius-md);
          font-size: 0.825rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .form-group input, .form-group select {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          padding: 0.625rem 0.875rem;
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group select:focus {
          border-color: var(--accent-primary);
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 0.75rem;
          color: var(--text-faint);
          pointer-events: none;
        }
        .input-with-icon input {
          width: 100%;
          padding-left: 2.25rem;
        }
        .full-width {
          width: 100%;
          justify-content: center;
        }
        .form-actions {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          margin-top: 0.5rem;
        }
        .fill-demo-btn {
          font-size: 0.825rem;
        }
        .modal-footer {
          margin-top: 1.25rem;
          text-align: center;
        }
        .toggle-mode-btn {
          background: transparent;
          color: var(--accent-primary);
          font-size: 0.825rem;
          text-decoration: underline;
        }
        .toggle-mode-btn:hover {
          color: var(--accent-secondary);
        }
      `}</style>
    </div>
  );
};
