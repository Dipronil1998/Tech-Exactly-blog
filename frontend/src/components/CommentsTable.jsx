import { useState } from 'react';
import { api } from '../api/client';
import { Trash2, MessageSquare, Search } from 'lucide-react';

export const CommentsTable = ({ comments = [], onRefresh }) => {
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  const filteredComments = comments.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.content || '').toLowerCase().includes(q) ||
      (c.author?.username || '').toLowerCase().includes(q) ||
      (c.post?.title || '').toLowerCase().includes(q)
    );
  });

  const handleDeleteComment = async (comment) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setLoadingId(comment._id);
    try {
      await api.deleteComment(comment._id);
      await onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="management-panel glass-panel">
      <div className="panel-header">
        <div>
          <h3>Community Comments Moderation</h3>
          <p className="panel-desc">Platform-wide discussion moderation and comment deletion.</p>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comment content, author, or post..."
          />
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Comment Content</th>
              <th>Author</th>
              <th>Post</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComments.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No comments found matching query.
                </td>
              </tr>
            ) : (
              filteredComments.map((c) => (
                <tr key={c._id}>
                  <td style={{ maxWidth: '340px' }}>
                    <div className="comment-content-cell">
                      <MessageSquare size={14} className="comment-quote-icon" />
                      <span className="comment-text">"{c.content}"</span>
                    </div>
                  </td>
                  <td>
                    <span className="author-pill">
                      {c.author?.name || c.author?.username || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <span className="post-ref-title">
                      {c.post?.title || 'Referenced Post'}
                    </span>
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons-cell">
                      <button
                        onClick={() => handleDeleteComment(c)}
                        disabled={loadingId === c._id}
                        className="btn-danger"
                        title="Delete comment"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .comment-content-cell {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .comment-quote-icon {
          color: var(--accent-emerald);
          flex-shrink: 0;
          margin-top: 3px;
        }
        .comment-text {
          font-style: italic;
          color: var(--text-main);
          line-height: 1.4;
        }
        .author-pill {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .post-ref-title {
          font-size: 0.825rem;
          color: var(--accent-cyan);
        }
      `}</style>
    </div>
  );
};
