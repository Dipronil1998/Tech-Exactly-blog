import { ShieldAlert, Lock, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AccessDenied = ({ onOpenLogin, onQuickAdminLogin }) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="access-denied-wrapper animate-fade-in">
      <div className="access-denied-card glass-panel">
        <div className="lock-icon-halo">
          <ShieldAlert size={48} className="shield-icon" />
        </div>

        <h1 className="access-denied-title">Restricted Admin Access</h1>
        <p className="access-denied-desc">
          {isAuthenticated
            ? `Signed in as "${user?.username}" with role [${user?.role?.toUpperCase()}]. You need administrator privileges to access this command center.`
            : 'Authentication and Administrator privileges are required to view this panel.'}
        </p>

        <div className="rbac-info-box">
          <Lock size={16} className="info-icon" />
          <span>RBAC Policy: Enforced by JWT & role-based middleware.</span>
        </div>

        <div className="action-buttons-group">
          {isAuthenticated ? (
            <button onClick={logout} className="btn-secondary">
              Sign Out & Switch Account
            </button>
          ) : (
            <button onClick={onOpenLogin} className="btn-secondary">
              Sign In with Credentials
            </button>
          )}

          <button onClick={onQuickAdminLogin} className="btn-primary">
            <UserCheck size={18} />
            Quick Demo Admin Access
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .access-denied-wrapper {
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .access-denied-card {
          max-width: 540px;
          width: 100%;
          padding: 3rem 2.5rem;
          text-align: center;
          background: rgba(19, 26, 42, 0.85);
          border: 1px solid rgba(244, 63, 94, 0.25);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
        }
        .lock-icon-halo {
          width: 90px;
          height: 90px;
          margin: 0 auto 1.5rem auto;
          border-radius: 50%;
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(244, 63, 94, 0.2);
        }
        .shield-icon {
          color: var(--accent-rose);
        }
        .access-denied-title {
          font-size: 1.75rem;
          margin-bottom: 0.75rem;
        }
        .access-denied-desc {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        .rbac-info-box {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.825rem;
          color: var(--text-muted);
          margin-bottom: 2rem;
        }
        .info-icon {
          color: var(--accent-amber);
        }
        .action-buttons-group {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
      `}</style>
    </div>
  );
};
