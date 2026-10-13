import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { UsersTable } from '../components/UsersTable';
import { PostsTable } from '../components/PostsTable';
import { CommentsTable } from '../components/CommentsTable';
import {
  Users,
  FileText,
  MessageSquare,
  RefreshCw,
  LayoutDashboard,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';

export const AdminDashboard = ({ onBackToStories }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'posts' | 'comments'
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [postsList, setPostsList] = useState([]);
  const [commentsList, setCommentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setError('');
    try {
      const [statsRes, usersRes, postsRes, commentsRes] = await Promise.all([
        api.getAdminStats(),
        api.getUsers('limit=50'),
        api.getPosts('includeDeleted=true&limit=50'),
        api.getAdminComments('limit=50'),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsersList(usersRes.data?.users || []);
      if (postsRes.success) setPostsList(postsRes.data?.posts || []);
      if (commentsRes.success) setCommentsList(commentsRes.data?.comments || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Error communicating with backend API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="dashboard-loading-state">
        <RefreshCw className="spinner-icon" size={28} />
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  const overview = stats?.overview || {
    totalUsers: usersList.length,
    totalPosts: postsList.filter((p) => !p.isDeleted).length,
    totalComments: commentsList.length,
    totalSoftDeletedPosts: postsList.filter((p) => p.isDeleted).length,
    adminUsersCount: usersList.filter((u) => u.role === 'admin').length,
    regularUsersCount: usersList.filter((u) => u.role === 'user').length,
  };

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Top Header */}
      <div className="dashboard-header">
        <div>
          <div className="admin-status-pill">
            <span className="pulse-dot"></span>
            <span>Administrator Access · {user?.email || user?.username}</span>
          </div>
          <h1 className="dashboard-title">System Administration</h1>
          <p className="dashboard-subtitle">
            Overview and moderation for users, blog posts, and comments.
          </p>
        </div>

        <div className="header-actions">
          <button
            onClick={onBackToStories || (() => navigate('/'))}
            className="btn-outline"
            title="Return to the reading feed"
          >
            ← Back to Stories
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="btn-secondary"
            title="Refresh statistics"
          >
            <RefreshCw size={15} className={refreshing ? 'spinner-icon' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-error-banner">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Metric Cards Grid (Total Users, Total Posts, Total Comments) */}
      <div className="stat-cards-grid">
        {/* Metric 1: Total Users */}
        <StatCard
          title="Total Users"
          value={overview.totalUsers}
          icon={Users}
          variant="users"
          badgeText={`${overview.adminUsersCount} Admins`}
          badgeType="neutral"
          subtitle={`${overview.regularUsersCount} regular members registered`}
        />

        {/* Metric 2: Total Posts */}
        <StatCard
          title="Total Posts"
          value={overview.totalPosts}
          icon={FileText}
          variant="posts"
          badgeText={`${overview.totalSoftDeletedPosts} Soft-deleted`}
          badgeType={overview.totalSoftDeletedPosts > 0 ? 'neutral' : 'positive'}
          subtitle="Articles actively published on the platform"
        />

        {/* Metric 3: Total Comments */}
        <StatCard
          title="Total Comments"
          value={overview.totalComments}
          icon={MessageSquare}
          variant="comments"
          badgeText="Active"
          badgeType="positive"
          subtitle="Community discussion engagements"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-navigation-bar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <LayoutDashboard size={16} />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          <Users size={16} />
          Users Directory ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
        >
          <FileText size={16} />
          Posts Oversight ({postsList.length})
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
        >
          <MessageSquare size={16} />
          Comments Moderation ({commentsList.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="tab-content-area">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            {/* Recent Posts Section */}
            <div className="overview-card glass-panel">
              <div className="overview-card-header">
                <div>
                  <h4>Recent Articles</h4>
                  <span className="overview-card-sub">Latest posts created across the platform</span>
                </div>
                <button
                  onClick={() => setActiveTab('posts')}
                  className="card-action-link"
                >
                  Manage all <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="activity-list">
                {postsList.slice(0, 5).map((post) => (
                  <div key={post._id} className="activity-item">
                    <div className="activity-indicator"></div>
                    <div className="activity-details">
                      <div className="activity-main-text">{post.title}</div>
                      <div className="activity-meta">
                        by {post.author?.name || post.author?.username} · {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {post.isDeleted && <span className="badge badge-deleted">Deleted</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Users Section */}
            <div className="overview-card glass-panel">
              <div className="overview-card-header">
                <div>
                  <h4>Latest Members</h4>
                  <span className="overview-card-sub">Recently registered user accounts</span>
                </div>
                <button
                  onClick={() => setActiveTab('users')}
                  className="card-action-link"
                >
                  Manage all <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="activity-list">
                {usersList.slice(0, 5).map((u) => (
                  <div key={u._id} className="activity-item">
                    <div className="user-initial-badge">
                      {(u.name?.[0] || u.username?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="activity-details">
                      <div className="activity-main-text">{u.name || u.username}</div>
                      <div className="activity-meta">{u.email}</div>
                    </div>
                    <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Comments Section */}
            <div className="overview-card glass-panel full-width-card">
              <div className="overview-card-header">
                <div>
                  <h4>Latest Community Comments</h4>
                  <span className="overview-card-sub">Real-time discussion comments on posts</span>
                </div>
                <button
                  onClick={() => setActiveTab('comments')}
                  className="card-action-link"
                >
                  Moderate all <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="activity-list">
                {commentsList.slice(0, 5).map((c) => (
                  <div key={c._id} className="activity-item">
                    <MessageSquare size={16} className="comment-bubble-icon" />
                    <div className="activity-details">
                      <div className="activity-main-text">"{c.content}"</div>
                      <div className="activity-meta">
                        by <span className="text-highlight">{c.author?.name || c.author?.username}</span> on post "{c.post?.title || 'Article'}"
                      </div>
                    </div>
                    <span className="timestamp-text">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <UsersTable
            users={usersList}
            onRefresh={fetchDashboardData}
            currentUserId={user?._id}
          />
        )}

        {activeTab === 'posts' && (
          <PostsTable posts={postsList} onRefresh={fetchDashboardData} />
        )}

        {activeTab === 'comments' && (
          <CommentsTable comments={commentsList} onRefresh={fetchDashboardData} />
        )}
      </div>

      <style>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem 1.5rem;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .admin-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--accent-emerald);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          margin-bottom: 0.5rem;
        }
        .dashboard-title {
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .dashboard-subtitle {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-top: 0.25rem;
        }
        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .dashboard-error-banner {
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.3);
          color: var(--accent-rose);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
        }
        .stat-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .tabs-navigation-bar {
          display: flex;
          gap: 0.5rem;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 1.5rem;
          overflow-x: auto;
          padding-bottom: 0.25rem;
        }
        .tab-btn {
          background: transparent;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-md) var(--radius-md) 0 0;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
        }
        .tab-btn:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.03);
        }
        .tab-btn.active {
          color: var(--accent-primary);
          border-bottom-color: var(--accent-primary);
          background: rgba(99, 102, 241, 0.08);
        }
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }
        }
        .full-width-card {
          grid-column: 1 / -1;
        }
        .overview-card {
          padding: 1.5rem;
        }
        .overview-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }
        .overview-card-header h4 {
          font-size: 1.1rem;
        }
        .overview-card-sub {
          font-size: 0.775rem;
          color: var(--text-muted);
        }
        .card-action-link {
          background: transparent;
          color: var(--accent-primary);
          font-size: 0.8rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .card-action-link:hover {
          color: var(--accent-secondary);
        }
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .activity-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }
        .activity-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-cyan);
        }
        .user-initial-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--gradient-admin);
          color: #fff;
          font-weight: 700;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .comment-bubble-icon {
          color: var(--accent-emerald);
          flex-shrink: 0;
        }
        .activity-details {
          flex: 1;
          min-width: 0;
        }
        .activity-main-text {
          font-size: 0.9rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .activity-meta {
          font-size: 0.775rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }
        .text-highlight {
          color: var(--text-main);
          font-weight: 500;
        }
        .timestamp-text {
          font-size: 0.775rem;
          color: var(--text-faint);
          white-space: nowrap;
        }
        .dashboard-loading-state {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: var(--text-muted);
        }
        .spinner-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
