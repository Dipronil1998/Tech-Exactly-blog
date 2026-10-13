import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { StoryFeed } from './components/StoryFeed';
import { StoryReader } from './components/StoryReader';
import { StoryEditor } from './components/StoryEditor';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './pages/AdminDashboard';
import { api } from './api/client';
import { RefreshCw } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

function PublishingPlatform() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState('feed'); // 'feed' | 'story' | 'editor' | 'admin'
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Fetch all posts from API
  const fetchPosts = async () => {
    try {
      const res = await api.getPosts('limit=50');
      if (res.success && res.data) {
        setPosts(res.data.posts || []);
      }
    } catch (err) {
      console.warn('Failed to load posts from API:', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Handlers
  const handleSelectStory = (post) => {
    setSelectedStory(post);
    setActiveView('story');
  };

  const handleEditStory = (post) => {
    setEditingStory(post);
    setActiveView('editor');
  };

  const handleOpenEditor = () => {
    setEditingStory(null);
    setActiveView('editor');
  };

  const handleStorySaved = (savedPost) => {
    fetchPosts();
    if (savedPost) {
      setSelectedStory(savedPost);
      setActiveView('story');
    } else {
      setActiveView('feed');
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await api.deletePost(id);
      await fetchPosts();
      if (activeView === 'story' && (selectedStory?._id === id || selectedStory?.id === id)) {
        setActiveView('feed');
        setSelectedStory(null);
      }
    } catch (err) {
      alert(`Could not delete post: ${err.message}`);
    }
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleNavigate = (view) => {
    if (view === 'editor' && !user) {
      handleOpenAuth('login');
      return;
    }
    setActiveView(view);
  };

  if (authLoading) {
    return (
      <div className="platform-loader">
        <RefreshCw size={24} className="loader-spinner" />
        <p>Loading The Chronicle...</p>
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
    <div className="platform-shell">
      {/* Navbar */}
      <Navbar
        activeView={activeView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main View Router */}
      <main className="platform-main">
        {activeView === 'feed' && (
          <StoryFeed
            posts={posts}
            loading={loadingPosts}
            searchQuery={searchQuery}
            onSelectStory={handleSelectStory}
            onEditStory={handleEditStory}
            onDeleteStory={handleDeletePost}
            onOpenEditor={handleOpenEditor}
            onRefreshPosts={fetchPosts}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activeView === 'story' && selectedStory && (
          <StoryReader
            post={selectedStory}
            onBack={() => setActiveView('feed')}
            onEdit={handleEditStory}
            onDeletePost={handleDeletePost}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activeView === 'editor' && (
          <StoryEditor
            initialPost={editingStory}
            onCancel={() => setActiveView('feed')}
            onSaved={handleStorySaved}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard onBackToStories={() => setActiveView('feed')} />
        )}
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
          <div className="footer-brand-col">
            <span className="footer-logo">The Chronicle</span>
            <p className="footer-tagline">
              A minimalist publishing platform dedicated to clean writing, ideas, and open dialogue.
            </p>
          </div>

          <div className="footer-links-group">
            <button onClick={() => setActiveView('feed')} className="footer-link">
              Stories
            </button>
            <button onClick={handleOpenEditor} className="footer-link">
              Write
            </button>
            {isAdmin && (
              <button onClick={() => setActiveView('admin')} className="footer-link">
                Admin Center
              </button>
            )}
            <a href="/api/docs" target="_blank" rel="noreferrer" className="footer-link">
              API Docs
            </a>
            <a href="/api/health" target="_blank" rel="noreferrer" className="footer-link">
              Health Status
            </a>
          </div>

          <div className="footer-copy">
            &copy; {CURRENT_YEAR} The Chronicle. All rights reserved.
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PublishingPlatform />
    </AuthProvider>
  );
}
