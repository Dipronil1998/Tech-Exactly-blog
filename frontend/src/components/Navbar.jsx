import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PenLine,
  Search,
  Sun,
  Moon,
  LogOut,
  Shield,
  X,
} from 'lucide-react';

export const Navbar = ({
  onOpenAuth,
  searchQuery,
  onSearchChange,
}) => {
  const { user, isAuthenticated, isAdmin, logout, theme, toggleTheme } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleWriteClick = () => {
    if (!isAuthenticated) {
      onOpenAuth('login');
      return;
    }
    navigate('/write');
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    onSearchChange(val);
    if (location.pathname !== '/' && val) {
      navigate('/');
    }
  };

  const handleAdminToggle = () => {
    if (location.pathname === '/admin') {
      navigate('/');
    } else {
      navigate('/admin');
    }
  };

  const isWriteActive = location.pathname === '/write' || location.pathname.startsWith('/edit');
  const isAdminActive = location.pathname === '/admin';

  return (
    <header className="minimal-header">
      <div className="header-inner">
        {/* Brand / Logo */}
        <div className="brand-group">
          <Link
            to="/"
            className="brand-link"
            title="Go to Home Feed"
          >
            <span className="brand-logo-mark">B</span>
            <span className="brand-title">Blogger</span>
          </Link>
          <span className="brand-divider">/</span>
        </div>

        {/* Search Bar (Medium style) */}
        <div className={`search-wrapper ${showSearch ? 'search-open-mobile' : ''}`}>
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search stories, topics, authors..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="clear-search-btn"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="nav-actions">
          {/* Mobile search toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="nav-icon-btn mobile-search-toggle"
            aria-label="Toggle Search"
          >
            <Search size={18} />
          </button>

          {/* Write Story Button */}
          <button
            onClick={handleWriteClick}
            className={`btn-write ${isWriteActive ? 'active' : ''}`}
            title="Write a story"
          >
            <PenLine size={16} />
            <span className="write-label">Write</span>
          </button>

          {/* Admin Dashboard Link (If Admin) */}
          {isAdmin && (
            <button
              onClick={handleAdminToggle}
              className={`btn-admin-nav ${isAdminActive ? 'active' : ''}`}
              title="System Administration"
            >
              <Shield size={15} />
              <span className="admin-label">
                {isAdminActive ? 'Back to Stories' : 'Admin'}
              </span>
            </button>
          )}

          {/* Theme Switch */}
          <button
            onClick={toggleTheme}
            className="nav-icon-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Auth State */}
          {isAuthenticated ? (
            <div className="user-dropdown-area">
              <div
                className="user-pill"
                title={`Signed in as ${user?.username} (${user?.role})`}
              >
                <div className="avatar-circle sm">
                  {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="user-name-label">{user?.username}</span>
              </div>

              <button
                onClick={logout}
                className="nav-icon-btn logout-btn"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="guest-actions">
              <button
                onClick={() => onOpenAuth('login')}
                className="btn-ghost-signin"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="btn-pill-get-started"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .minimal-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background-color: var(--bg-primary);
          border-bottom: 1px solid var(--border-subtle);
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .header-inner {
          max-width: var(--container-width);
          margin: 0 auto;
          padding: 0.85rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
        }

        .brand-group {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-shrink: 0;
        }

        .brand-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-serif);
          font-size: 1.45rem;
          font-weight: 700;
          color: var(--text-main);
          letter-spacing: -0.02em;
          text-decoration: none;
        }

        .brand-logo-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: var(--text-main);
          color: var(--bg-primary);
          border-radius: 4px;
          font-family: var(--font-serif);
          font-weight: 800;
          font-size: 1.1rem;
        }

        .brand-divider {
          color: var(--border-muted);
          font-size: 0.9rem;
        }

        .brand-tagline {
          color: var(--text-muted);
          font-size: 0.825rem;
          font-weight: 400;
        }

        @media (max-width: 820px) {
          .brand-divider,
          .brand-tagline {
            display: none;
          }
        }

        /* Search styling */
        .search-wrapper {
          flex: 1;
          max-width: 360px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--bg-subtle);
          border-radius: var(--radius-pill);
          padding: 0.35rem 0.85rem;
          border: 1px solid transparent;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .search-box:focus-within {
          border-color: var(--border-muted);
          background: var(--bg-primary);
        }

        .search-icon {
          color: var(--text-muted);
          margin-right: 0.5rem;
          flex-shrink: 0;
        }

        .search-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-sans);
          font-size: 0.85rem;
          color: var(--text-main);
        }

        .search-input::placeholder {
          color: var(--text-faint);
        }

        .clear-search-btn {
          color: var(--text-faint);
          display: flex;
          align-items: center;
          padding: 2px;
        }

        .clear-search-btn:hover {
          color: var(--text-main);
        }

        @media (max-width: 700px) {
          .search-wrapper {
            display: none;
          }
          .search-wrapper.search-open-mobile {
            display: block;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg-primary);
            padding: 0.75rem 1.25rem;
            max-width: none;
            border-bottom: 1px solid var(--border-subtle);
          }
        }

        .mobile-search-toggle {
          display: none;
        }

        @media (max-width: 700px) {
          .mobile-search-toggle {
            display: inline-flex;
          }
        }

        /* Nav actions */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .btn-write {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-muted);
          padding: 0.45rem 0.75rem;
          border-radius: var(--radius-pill);
          font-size: 0.875rem;
          font-weight: 400;
          transition: all 0.15s ease;
        }

        .btn-write:hover,
        .btn-write.active {
          color: var(--text-main);
          background: var(--bg-subtle);
        }

        .btn-admin-nav {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-muted);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-pill);
          font-size: 0.8rem;
          border: 1px solid var(--border-subtle);
          transition: all 0.15s ease;
        }

        .btn-admin-nav:hover,
        .btn-admin-nav.active {
          color: var(--text-main);
          border-color: var(--text-main);
          background: var(--bg-subtle);
        }

        .nav-icon-btn {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-pill);
          color: var(--text-muted);
          transition: all 0.15s ease;
        }

        .nav-icon-btn:hover {
          color: var(--text-main);
          background: var(--bg-subtle);
        }

        .user-dropdown-area {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .user-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.65rem 0.25rem 0.35rem;
          border-radius: var(--radius-pill);
          background: var(--bg-subtle);
          font-size: 0.825rem;
          font-weight: 500;
        }

        .user-name-label {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .guest-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .btn-ghost-signin {
          color: var(--text-muted);
          font-size: 0.875rem;
          padding: 0.4rem 0.75rem;
          border-radius: var(--radius-pill);
        }

        .btn-ghost-signin:hover {
          color: var(--text-main);
        }

        .btn-pill-get-started {
          background: var(--text-main);
          color: var(--bg-primary);
          padding: 0.45rem 1rem;
          border-radius: var(--radius-pill);
          font-size: 0.85rem;
          font-weight: 500;
          transition: opacity 0.15s ease;
        }

        .btn-pill-get-started:hover {
          opacity: 0.88;
        }
      `}</style>
    </header>
  );
};
