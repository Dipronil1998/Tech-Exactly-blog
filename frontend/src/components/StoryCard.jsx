import { MessageSquare, Clock, Trash2, Edit3, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculateReadTime, formatDate } from '../utils/readingUtils';

export const StoryCard = ({ post, onSelect, onEdit, onDelete }) => {
  const { user, isAdmin } = useAuth();

  const authorName =
    post.author?.name || post.author?.username || (typeof post.author === 'string' ? 'Contributor' : 'Author');
  const authorInitial = authorName[0]?.toUpperCase() || 'A';
  const readTime = calculateReadTime(post.content);
  const formattedDate = formatDate(post.createdAt);

  const isAuthor = user && (user._id === post.author?._id || user.id === post.author?._id);
  const canManage = isAuthor || isAdmin;

  // Extract a topic tag based on content or title
  const extractTopic = (title = '', content = '') => {
    const text = `${title} ${content}`.toLowerCase();
    if (text.includes('react') || text.includes('javascript') || text.includes('code') || text.includes('api'))
      return 'Engineering';
    if (text.includes('design') || text.includes('ux') || text.includes('minimal'))
      return 'Design';
    if (text.includes('ai') || text.includes('intelligence') || text.includes('model'))
      return 'Artificial Intelligence';
    if (text.includes('future') || text.includes('life') || text.includes('productivity'))
      return 'Mindset';
    return 'Essay';
  };

  const topicTag = extractTopic(post.title, post.content);

  return (
    <article className="story-card" onClick={() => onSelect(post)}>
      {/* Top Author Metadata */}
      <div className="story-card-meta">
        <div className="avatar-circle sm">
          {authorInitial}
        </div>
        <span className="story-card-author">{authorName}</span>
        <span>·</span>
        <time dateTime={post.createdAt}>{formattedDate}</time>
        {post.status === 'draft' && (
          <span className="badge badge-draft">
            <Lock size={10} style={{ marginRight: 3 }} /> Draft
          </span>
        )}
      </div>

      {/* Title & Preview */}
      <h2 className="story-card-title">{post.title}</h2>
      <p className="story-card-excerpt">
        {post.content ? post.content.replace(/#+\s|(\*\*|\*|_|`)/g, '') : ''}
      </p>

      {/* Card Footer */}
      <div className="story-card-footer" onClick={(e) => e.stopPropagation()}>
        <div className="footer-left">
          <span className="tag-pill">{topicTag}</span>
          <span className="read-time-indicator">
            <Clock size={13} />
            {readTime}
          </span>
          {typeof post.commentCount === 'number' && post.commentCount > 0 && (
            <span className="comment-indicator" title={`${post.commentCount} comments`}>
              <MessageSquare size={13} />
              {post.commentCount}
            </span>
          )}
        </div>

        {canManage && (
          <div className="card-actions">
            <button
              onClick={() => onEdit(post)}
              className="action-icon-btn"
              title="Edit Story"
              aria-label="Edit Story"
            >
              <Edit3 size={15} />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete story "${post.title}"?`)) {
                  onDelete(post._id || post.id);
                }
              }}
              className="action-icon-btn danger"
              title="Delete Story"
              aria-label="Delete Story"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .story-card {
          padding: 1.75rem 0;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .story-card:last-child {
          border-bottom: none;
        }

        .story-card-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.825rem;
          color: var(--text-muted);
        }

        .story-card-author {
          font-weight: 500;
          color: var(--text-main);
        }

        .story-card-title {
          font-family: var(--font-serif);
          font-size: 1.45rem;
          font-weight: 700;
          line-height: 1.3;
          color: var(--text-main);
          letter-spacing: -0.015em;
          transition: color 0.15s ease;
        }

        .story-card:hover .story-card-title {
          color: var(--accent-primary);
        }

        .story-card-excerpt {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.55;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .story-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.35rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }

        .read-time-indicator,
        .comment-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          color: var(--text-muted);
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .action-icon-btn {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-pill);
          color: var(--text-muted);
          transition: all 0.15s ease;
        }

        .action-icon-btn:hover {
          color: var(--text-main);
          background: var(--bg-subtle);
        }

        .action-icon-btn.danger:hover {
          color: var(--accent-rose);
          background: rgba(211, 47, 47, 0.08);
        }
      `}</style>
    </article>
  );
};
