import { useState } from 'react';
import { api } from '../api/client';
import { Trash2, RotateCcw, Search, ExternalLink } from 'lucide-react';

export const PostsTable = ({ posts = [], onRefresh }) => {
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  const filteredPosts = posts.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.slug || '').toLowerCase().includes(q) ||
      (p.author?.username || '').toLowerCase().includes(q)
    );
  });

  const handleDeletePost = async (post) => {
    if (!window.confirm(`Soft-delete post "${post.title}"?`)) return;
    setLoadingId(post._id);
    try {
      await api.deletePost(post._id);
      await onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete post');
    } finally {
      setLoadingId(null);
    }
  };

  const handleRestorePost = async (post) => {
    setLoadingId(post._id);
    try {
      await api.restorePost(post._id);
      await onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to restore post');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="management-panel glass-panel">
      <div className="panel-header">
        <div>
          <h3>Blog Posts Oversight</h3>
          <p className="panel-desc">Manage platform articles, slugs, and soft-delete states.</p>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, slug, or author..."
          />
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title & Slug</th>
              <th>Author</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No posts found matching query.
                </td>
              </tr>
            ) : (
              filteredPosts.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div>
                      <div className="post-table-title">{p.title}</div>
                      <div className="post-table-slug">/{p.slug}</div>
                    </div>
                  </td>
                  <td>
                    <span className="author-name">
                      {p.author?.name || p.author?.username || 'Unknown Author'}
                    </span>
                  </td>
                  <td>
                    {p.isDeleted ? (
                      <span className="badge badge-deleted">Soft-Deleted</span>
                    ) : (
                      <span className="badge badge-published">Published</span>
                    )}
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons-cell">
                      {p.isDeleted ? (
                        <button
                          onClick={() => handleRestorePost(p)}
                          disabled={loadingId === p._id}
                          className="btn-action restore-btn"
                          title="Restore soft-deleted post"
                        >
                          <RotateCcw size={14} />
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeletePost(p)}
                          disabled={loadingId === p._id}
                          className="btn-danger"
                          title="Soft delete post"
                        >
                          <Trash2 size={14} />
                          Soft Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .post-table-title {
          font-weight: 600;
          color: var(--text-main);
        }
        .post-table-slug {
          font-size: 0.775rem;
          color: var(--accent-cyan);
          font-family: var(--font-mono);
        }
        .author-name {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .restore-btn {
          color: var(--accent-emerald) !important;
          border-color: rgba(16, 185, 129, 0.3) !important;
        }
        .restore-btn:hover {
          background: rgba(16, 185, 129, 0.1) !important;
        }
      `}</style>
    </div>
  );
};
