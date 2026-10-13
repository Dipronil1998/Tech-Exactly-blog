import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { StoryFeed } from './components/StoryFeed';
import { StoryReader } from './components/StoryReader';
import { StoryEditor } from './components/StoryEditor';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './pages/AdminDashboard';
import { api } from './api/client';
import { RefreshCw, ShieldAlert, ArrowLeft } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

// Protected Admin Route Component
function AdminRoute({ onOpenAuth }) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="access-denied-wrapper animate-fade-in">
        <div className="access-denied-card">
          <div className="denied-icon-halo">
            <ShieldAlert size={36} />
          </div>
          <h2 className="denied-title">Administrator Access Required</h2>
          <p className="denied-desc">
            {user
              ? `You are currently signed in as "${user.username}" with role [${user.role?.toUpperCase()}]. Admin privileges are required to view this panel.`
              : 'Please sign in with an administrator account to access the system administration panel.'}
          </p>
          <div className="denied-actions">
            {!user ? (
              <button onClick={() => onOpenAuth('login')} className="btn-primary">
                Sign In as Admin
              </button>
            ) : null}
            <button onClick={() => navigate('/')} className="btn-outline">
              <ArrowLeft size={15} />
              <span>Return to Stories</span>
            </button>
          </div>
        </div>

        <style>{`
          .access-denied-wrapper {
            min-height: calc(100vh - 180px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1.25rem;
          }
          .access-denied-card {
            max-width: 480px;
            width: 100%;
            background: var(--bg-surface);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-lg);
            padding: 2.5rem 2rem;
            text-align: center;
            box-shadow: var(--shadow-sm);
          }
          .denied-icon-halo {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: #ffebee;
            color: var(--accent-rose);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.25rem auto;
          }
          .denied-title {
            font-family: var(--font-serif);
            font-size: 1.5rem;
            margin-bottom: 0.6rem;
          }
          .denied-desc {
            color: var(--text-muted);
            font-size: 0.9rem;
            line-height: 1.6;
            margin-bottom: 1.75rem;
          }
          .denied-actions {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
        `}</style>
      </div>
    );
  }

  return <AdminDashboard />;
}

function PublishingPlatform() {
  const { loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Fetch posts from API with backend search & pagination
  const fetchPosts = useCallback(async (targetPage = 1, query = searchQuery) => {
    setLoadingPosts(true);
    try {
      const res = await api.getPosts({
        page: targetPage,
        limit: 5,
        search: query ? query.trim() : undefined,
      });
      if (res.success && res.data) {
        setPosts(res.data.posts || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.warn('Failed to load posts from API:', err.message);
    } finally {
      setLoadingPosts(false);
    }
  }, [searchQuery]);

  // Debounced search triggers backend query on page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPosts(1, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchPosts]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchPosts(newPage, searchQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePost = async (id) => {
    try {
      await api.deletePost(id);
      await fetchPosts(page, searchQuery);
    } catch (err) {
      alert(`Could not delete post: ${err.message}`);
    }
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  if (authLoading) {
    return (
      <div className="platform-loader">
        <RefreshCw size={24} className="loader-spinner" />
        <p>Loading Blogger...</p>
        <style>{`
          .platform-loader {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            color: var(--text-muted);
            font-size: 0.9rem;
          }
          .loader-spinner {
            animation: spin 1s linear infinite;
            color: var(--accent-primary);
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="platform-shell">
        {/* Navbar */}
        <Navbar
          onOpenAuth={handleOpenAuth}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* React Router Routes */}
        <main className="platform-main">
          <Routes>
            {/* 1. Main Feed */}
            <Route
              path="/"
              element={
                <StoryFeed
                  posts={posts}
                  loading={loadingPosts}
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery('')}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onDeleteStory={handleDeletePost}
                  onOpenAuth={handleOpenAuth}
                />
              }
            />

            {/* 2. Blog Details Route */}
            <Route
              path="/posts/:id"
              element={<StoryReader onOpenAuth={handleOpenAuth} />}
            />

            {/* 3. New Story Editor */}
            <Route
              path="/write"
              element={
                <StoryEditor
                  onSaved={() => {
                    setSearchQuery('');
                    setPage(1);
                    fetchPosts(1, '');
                  }}
                />
              }
            />

            {/* 4. Edit Story Route */}
            <Route
              path="/edit/:id"
              element={<StoryEditor onSaved={() => fetchPosts(page, searchQuery)} />}
            />

            {/* 5. Admin Dashboard Route */}
            <Route
              path="/admin"
              element={<AdminRoute onOpenAuth={handleOpenAuth} />}
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Authentication Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authMode}
          onClose={() => setIsAuthOpen(false)}
        />

        {/* Minimal Editorial Footer */}
        <footer className="platform-footer">
          <div className="footer-container">
            <div className="footer-copy">
              &copy; {CURRENT_YEAR}  All rights reserved.
            </div>
          </div>
        </footer>

        <style>{`
          .platform-shell {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            background: var(--bg-primary);
            color: var(--text-main);
          }

          .platform-main {
            flex: 1;
          }

          .platform-footer {
            border-top: 1px solid var(--border-subtle);
            padding: 3rem 1.25rem 2.5rem;
            background: var(--bg-primary);
            color: var(--text-muted);
            font-size: 0.85rem;
          }

          .footer-container {
            max-width: var(--container-width);
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 1.5rem;
          }

          .footer-logo {
            font-family: var(--font-serif);
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-main);
          }

          .footer-tagline {
            font-size: 0.825rem;
            color: var(--text-muted);
            margin-top: 0.35rem;
            max-width: 480px;
          }

          .footer-links-group {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1.5rem;
            flex-wrap: wrap;
          }

          .footer-link {
            color: var(--text-muted);
            transition: color 0.15s ease;
            font-size: 0.85rem;
            text-decoration: none;
          }

          .footer-link:hover {
            color: var(--text-main);
          }

          .footer-copy {
            font-size: 0.775rem;
            color: var(--text-faint);
          }
        `}</style>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PublishingPlatform />
    </AuthProvider>
  );
}
