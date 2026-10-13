import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { calculateReadTime, formatDate } from '../utils/readingUtils';
import {
  ArrowLeft,
  MessageSquare,
  Share2,
  Trash2,
  Edit3,
  Check,
  Send,
  Lock,
  RefreshCw,
} from 'lucide-react';

export const StoryReader = ({ onOpenAuth }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [post, setPost] = useState(location.state?.post || null);
  const [loadingPost, setLoadingPost] = useState(!location.state?.post);
  const [postError, setPostError] = useState('');

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [claps, setClaps] = useState(18);
  const [hasClapped, setHasClapped] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentError, setCommentError] = useState('');

  // Fetch post details if not provided via navigation state
  useEffect(() => {
    const fetchPostDetails = async () => {
      if (post && (post._id === id || post.slug === id || post.id === id)) {
        setLoadingPost(false);
        return;
      }
      setLoadingPost(true);
      setPostError('');
      try {
        const res = await api.getPost(id);
        if (res.success && res.data?.post) {
          setPost(res.data.post);
        } else {
          setPostError('Story not found.');
        }
      } catch (err) {
        setPostError(err.message || 'Could not load story.');
      } finally {
        setLoadingPost(false);
      }
    };

    fetchPostDetails();
  }, [id]);

  const postId = post?._id || post?.id;

  // Initialize claps
  useEffect(() => {
    if (postId) {
      const saved = localStorage.getItem(`claps_${postId}`);
      if (saved) setClaps(parseInt(saved, 10));
    }
  }, [postId]);

  // Load comments
  const fetchComments = useCallback(async () => {
    if (!postId) return;
    try {
      const res = await api.getComments(postId);
      if (res.success && res.data) {
        setComments(res.data.comments || []);
      }
    } catch (err) {
      console.warn('Could not load comments:', err.message);
    } finally {
      setLoadingComments(false);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) {
      fetchComments();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [postId, fetchComments]);

  // Handle claps
  const handleClap = () => {
    const nextClaps = claps + 1;
    setClaps(nextClaps);
    setHasClapped(true);
    if (postId) {
      localStorage.setItem(`claps_${postId}`, nextClaps);
    }
  };

  // Handle share
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Submit comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isAuthenticated) {
      onOpenAuth('login');
      return;
    }

    setSubmittingComment(true);
    setCommentError('');
    try {
      const res = await api.createComment(postId, { content: newComment.trim() });
      if (res.success && res.data?.comment) {
        setComments((prev) => [res.data.comment, ...prev]);
        setNewComment('');
      } else {
        await fetchComments();
        setNewComment('');
      }
    } catch (err) {
      setCommentError(err.message || 'Could not post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => (c._id || c.id) !== commentId));
    } catch (err) {
      alert(`Could not delete comment: ${err.message}`);
    }
  };

  // Delete story
  const handleDeletePost = async () => {
    if (!window.confirm(`Delete story "${post.title}"?`)) return;
    try {
      await api.deletePost(postId);
      navigate('/');
    } catch (err) {
      alert(`Could not delete story: ${err.message}`);
    }
  };

  // Render paragraphs, blockquotes, headings formatted
  const renderFormattedContent = (text = '') => {
    const lines = text.split('\n');
    const elements = [];
    let currentParagraph = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={`p-${elements.length}`}>{currentParagraph.join(' ')}</p>
        );
        currentParagraph = [];
      }
    };

    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        return;
      }

      if (line.startsWith('### ')) {
        flushParagraph();
        elements.push(<h3 key={`h3-${index}`}>{line.replace('### ', '')}</h3>);
      } else if (line.startsWith('## ')) {
        flushParagraph();
        elements.push(<h2 key={`h2-${index}`}>{line.replace('## ', '')}</h2>);
      } else if (line.startsWith('# ')) {
        flushParagraph();
        elements.push(<h2 key={`h1-${index}`}>{line.replace('# ', '')}</h2>);
      } else if (line.startsWith('> ')) {
        flushParagraph();
        elements.push(
          <blockquote key={`quote-${index}`}>{line.replace('> ', '')}</blockquote>
        );
      } else if (line.startsWith('```')) {
        flushParagraph();
        elements.push(
          <pre key={`code-${index}`}>
            <code>{line.replace(/```/g, '')}</code>
          </pre>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        flushParagraph();
        elements.push(
          <ul key={`ul-${index}`}>
            <li>{line.replace(/^[-*]\s+/, '')}</li>
          </ul>
        );
      } else {
        currentParagraph.push(line);
      }
    });

    flushParagraph();

    return elements.length > 0 ? elements : <p>{text}</p>;
  };

  if (loadingPost) {
    return (
      <div className="reader-loader animate-fade-in">
        <RefreshCw size={26} className="spinner-icon" />
        <p>Loading article...</p>
        <style>{`
          .reader-loader {
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

  if (postError || !post) {
    return (
      <div className="reader-canvas animate-fade-in">
        <button onClick={() => navigate('/')} className="back-link">
          <ArrowLeft size={16} />
          <span>Back to stories</span>
        </button>
        <div className="story-not-found-card">
          <h2>Story Not Found</h2>
          <p>{postError || "The story you're looking for does not exist or has been removed."}</p>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '1.25rem' }}>
            Browse All Stories
          </button>
        </div>
        <style>{`
          .story-not-found-card {
            padding: 3rem 1.5rem;
            text-align: center;
            background: var(--bg-secondary);
            border-radius: var(--radius-md);
            border: 1px solid var(--border-subtle);
            margin-top: 1.5rem;
          }
          .story-not-found-card h2 {
            font-family: var(--font-serif);
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
          }
          .story-not-found-card p {
            color: var(--text-muted);
          }
        `}</style>
      </div>
    );
  }

  const authorName =
    post.author?.name || post.author?.username || (typeof post.author === 'string' ? 'Contributor' : 'Author');
  const authorInitial = authorName[0]?.toUpperCase() || 'A';
  const readTime = calculateReadTime(post.content);
  const formattedDate = formatDate(post.createdAt);

  const isAuthor = user && (user._id === post.author?._id || user.id === post.author?._id);
  const canManagePost = isAuthor || isAdmin;

  return (
    <div className="reader-canvas animate-fade-in">
      {/* Back button */}
      <button onClick={() => navigate('/')} className="back-link">
        <ArrowLeft size={16} />
        <span>Back to stories</span>
      </button>

      {/* Headline */}
      <h1 className="reader-title">{post.title}</h1>

      {/* Author Byline */}
      <div className="reader-byline">
        <div className="reader-author-info">
          <div className="avatar-circle lg">{authorInitial}</div>
          <div>
            <div className="reader-author-name">{authorName}</div>
            <div className="reader-meta-row">
              <time dateTime={post.createdAt}>{formattedDate}</time>
              <span>·</span>
              <span>{readTime}</span>
              {post.status === 'draft' && (
                <span className="badge badge-draft">
                  <Lock size={10} style={{ marginRight: 3 }} /> Draft
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top actions */}
        <div className="reader-actions-top">
          <button
            onClick={handleShare}
            className="action-pill-btn"
            title="Share story"
          >
            {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>

          {canManagePost && (
            <>
              <button
                onClick={() => navigate(`/edit/${postId}`, { state: { post } })}
                className="action-pill-btn"
                title="Edit story"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDeletePost}
                className="action-pill-btn danger"
                title="Delete story"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Story Content */}
      <article className="reader-body">
        {renderFormattedContent(post.content)}
      </article>

      {/* Reader Engagement Bar (Medium Clap Bar) */}
      <div className="reader-engagement-bar">
        <div className="engagement-left">
          <button
            onClick={handleClap}
            className={`clap-btn ${hasClapped ? 'clapped' : ''}`}
            title="Applaud story"
          >
            <span className="clap-emoji">👏</span>
            <span className="clap-count">{claps}</span>
          </button>

          <a href="#comments" className="comments-jump-btn">
            <MessageSquare size={18} />
            <span>{comments.length}</span>
          </a>
        </div>

        <button onClick={handleShare} className="share-bottom-btn" title="Share story">
          {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
          <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
        </button>
      </div>

      {/* Comments / Responses Section */}
      <section id="comments" className="responses-section">
        <h3 className="responses-heading">Responses ({comments.length})</h3>

        {/* Response Box */}
        {isAuthenticated ? (
          <form onSubmit={handleCommentSubmit} className="response-form">
            <div className="response-user-row">
              <div className="avatar-circle sm">
                {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="response-author-name">{user?.name || user?.username}</span>
            </div>

            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What are your thoughts?"
              className="clean-textarea response-input"
              rows={3}
              required
            />

            {commentError && <div className="comment-error">{commentError}</div>}

            <div className="response-actions">
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="btn-primary"
              >
                <Send size={14} />
                <span>{submittingComment ? 'Posting...' : 'Respond'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="signin-to-respond-box">
            <p>Join the conversation to leave a response.</p>
            <button onClick={() => onOpenAuth('login')} className="btn-outline">
              Sign in to respond
            </button>
          </div>
        )}

        {/* Comments List */}
        <div className="comments-list">
          {loadingComments ? (
            <p className="loading-text">Loading responses...</p>
          ) : comments.length === 0 ? (
            <p className="empty-responses-text">
              There are no responses yet. Be the first to share your thoughts!
            </p>
          ) : (
            comments.map((comment) => {
              const cAuthor =
                comment.author?.name ||
                comment.author?.username ||
                (typeof comment.author === 'string' ? 'Reader' : 'Anonymous');
              const cInitial = cAuthor[0]?.toUpperCase() || 'R';
              const canDelete =
                user &&
                (isAdmin || user._id === comment.author?._id || user.id === comment.author?._id);

              return (
                <div key={comment._id || comment.id} className="comment-item">
                  <div className="comment-header">
                    <div className="comment-author-info">
                      <div className="avatar-circle sm">{cInitial}</div>
                      <div>
                        <span className="comment-author-name">{cAuthor}</span>
                        <span className="comment-date">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(comment._id || comment.id)}
                        className="delete-comment-btn"
                        title="Delete response"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <p className="comment-body">{comment.content}</p>
                </div>
              );
            })
          )}
        </div>
      </section>

      <style>{`
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-bottom: 2rem;
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-pill);
          transition: all 0.15s ease;
        }

        .back-link:hover {
          color: var(--text-main);
          background: var(--bg-subtle);
        }

        .reader-actions-top {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-pill);
          background: var(--bg-subtle);
          color: var(--text-muted);
          transition: all 0.15s ease;
        }

        .action-pill-btn:hover {
          color: var(--text-main);
          background: var(--bg-hover);
        }

        .action-pill-btn.danger:hover {
          color: var(--accent-rose);
          background: rgba(211, 47, 47, 0.08);
        }

        /* Engagement Bar */
        .reader-engagement-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 0;
          margin: 3.5rem 0 2.5rem;
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
        }

        .engagement-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .clap-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.95rem;
          color: var(--text-muted);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-pill);
          transition: all 0.15s ease;
        }

        .clap-btn:hover {
          background: var(--bg-subtle);
          color: var(--text-main);
        }

        .clap-btn.clapped {
          color: var(--accent-primary);
          font-weight: 600;
        }

        .clap-emoji {
          font-size: 1.25rem;
          transition: transform 0.1s ease;
        }

        .clap-btn:active .clap-emoji {
          transform: scale(1.3) rotate(-10deg);
        }

        .comments-jump-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.9rem;
          color: var(--text-muted);
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-pill);
        }

        .comments-jump-btn:hover {
          color: var(--text-main);
          background: var(--bg-subtle);
        }

        .share-bottom-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-pill);
        }

        .share-bottom-btn:hover {
          color: var(--text-main);
          background: var(--bg-subtle);
        }

        /* Responses */
        .responses-section {
          padding-top: 1rem;
        }

        .responses-heading {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .response-form {
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          margin-bottom: 2.5rem;
        }

        .response-user-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.85rem;
        }

        .response-author-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .response-input {
          background: var(--bg-primary);
          margin-bottom: 0.85rem;
        }

        .response-actions {
          display: flex;
          justify-content: flex-end;
        }

        .signin-to-respond-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.75rem;
          text-align: center;
          margin-bottom: 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
          color: var(--text-muted);
        }

        .comment-error {
          color: var(--accent-rose);
          font-size: 0.85rem;
          margin-bottom: 0.75rem;
        }

        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .comment-item {
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .comment-item:last-child {
          border-bottom: none;
        }

        .comment-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.65rem;
        }

        .comment-author-info {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .comment-author-name {
          font-size: 0.875rem;
          font-weight: 600;
          display: block;
        }

        .comment-date {
          font-size: 0.775rem;
          color: var(--text-muted);
        }

        .comment-body {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-main);
          white-space: pre-wrap;
        }

        .delete-comment-btn {
          color: var(--text-faint);
          padding: 4px;
          border-radius: var(--radius-pill);
        }

        .delete-comment-btn:hover {
          color: var(--accent-rose);
        }

        .loading-text,
        .empty-responses-text {
          color: var(--text-muted);
          font-size: 0.9rem;
          padding: 1.5rem 0;
        }
      `}</style>
    </div>
  );
};
