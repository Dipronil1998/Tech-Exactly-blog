import { useNavigate } from 'react-router-dom';
import { StoryCard } from './StoryCard';
import { calculateReadTime, formatDate } from '../utils/readingUtils';
import { useAuth } from '../context/AuthContext';
import { PenLine, Compass, ChevronLeft, ChevronRight, X } from 'lucide-react';

export const StoryFeed = ({
  posts = [],
  loading = false,
  searchQuery = '',
  onClearSearch,
  pagination = { total: 0, page: 1, pages: 1, limit: 10 },
  onPageChange,
  onDeleteStory,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Only author or admin sees draft stories
  const displayPosts = posts.filter(
    (post) => post.status !== 'draft' || (user && post.author?._id === user._id)
  );

  // Featured Lead Story only on page 1 with no search query
  const isFirstPage = !pagination || pagination.page === 1;
  const featuredPost = displayPosts.length > 0 && !searchQuery && isFirstPage
    ? displayPosts[0]
    : null;

  const standardPosts = featuredPost
    ? displayPosts.slice(1)
    : displayPosts;

  const handleHeroClick = () => {
    if (!featuredPost) return;
    navigate(`/posts/${featuredPost.slug || featuredPost._id || featuredPost.id}`, {
      state: { post: featuredPost },
    });
  };

  const handleWriteClick = () => {
    if (!isAuthenticated) {
      onOpenAuth('login');
      return;
    }
    navigate('/write');
  };

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.pages || 1;
  const totalItems = pagination?.total || displayPosts.length;
  const currentLimit = pagination?.limit || 10;
  const startItem = totalItems > 0 ? (currentPage - 1) * currentLimit + 1 : 0;
  const endItem = Math.min(currentPage * currentLimit, totalItems);

  return (
    <div className="feed-container animate-fade-in">
      {/* Search Header if Active */}
      {searchQuery && (
        <div className="search-results-banner">
          <div className="search-banner-text">
            <span>Showing results for <strong>"{searchQuery}"</strong></span>
            <span className="search-count-badge">
              {totalItems} {totalItems === 1 ? 'story' : 'stories'} found
            </span>
          </div>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="clear-search-pill"
              title="Clear search"
            >
              <X size={13} />
              <span>Clear search</span>
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="loading-feed">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="story-card-skeleton">
              <div className="skeleton-line sm"></div>
              <div className="skeleton-line lg"></div>
              <div className="skeleton-line md"></div>
            </div>
          ))}
        </div>
      ) : displayPosts.length === 0 ? (
        /* Empty State */
        <div className="empty-feed-card">
          <div className="empty-icon-halo">
            <Compass size={32} />
          </div>
          <h3 className="empty-title">
            {searchQuery
              ? `No stories found for "${searchQuery}"`
              : 'No stories published yet'}
          </h3>
          <p className="empty-desc">
            {searchQuery
              ? 'Try searching with different keywords or title terms.'
              : 'Be the first voice on The Chronicle by sharing your perspective with the world.'}
          </p>

          <div className="empty-actions">
            {searchQuery && onClearSearch ? (
              <button
                onClick={onClearSearch}
                className="btn-secondary"
              >
                Clear Search & View All
              </button>
            ) : (
              <button
                onClick={handleWriteClick}
                className="btn-primary"
              >
                <PenLine size={16} />
                <span>Write a Story</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Story Feed Stream */
        <div className="stories-stream">
          {/* Featured Lead Hero (Only on Page 1 & without search) */}
          {featuredPost && (
            <div
              className="featured-hero-card"
              onClick={handleHeroClick}
            >
              <div className="featured-badge">Featured Story</div>
              <h1 className="featured-hero-title">{featuredPost.title}</h1>
              <p className="featured-hero-excerpt">
                {featuredPost.content
                  ? featuredPost.content.replace(/#+\s|(\*\*|\*|_|`)/g, '')
                  : ''}
              </p>
              <div className="featured-hero-meta">
                <span className="featured-author">
                  {featuredPost.author?.name || featuredPost.author?.username || 'Author'}
                </span>
                <span>·</span>
                <span>{formatDate(featuredPost.createdAt)}</span>
                <span>·</span>
                <span>{calculateReadTime(featuredPost.content)}</span>
              </div>
            </div>
          )}

          {/* Standard Story Cards */}
          <div className="standard-feed-list">
            {standardPosts.map((post) => (
              <StoryCard
                key={post._id || post.id}
                post={post}
                onDelete={onDeleteStory}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && onPageChange && (
            <nav className="pagination-bar" aria-label="Stories pagination">
              <div className="pagination-info">
                Showing <span>{startItem}</span>–<span>{endItem}</span> of{' '}
                <span>{totalItems}</span> stories
              </div>

              <div className="pagination-controls">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="pagination-nav-btn"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    // Show first, last, current, and surrounding pages
                    const isVisible =
                      p === 1 ||
                      p === totalPages ||
                      (p >= currentPage - 1 && p <= currentPage + 1);

                    const isEllipsisBefore = p === currentPage - 2 && p > 1;
                    const isEllipsisAfter = p === currentPage + 2 && p < totalPages;

                    if (isVisible) {
                      return (
                        <button
                          key={p}
                          onClick={() => onPageChange(p)}
                          disabled={loading}
                          className={`page-number-btn ${p === currentPage ? 'active' : ''}`}
                          aria-current={p === currentPage ? 'page' : undefined}
                        >
                          {p}
                        </button>
                      );
                    } else if (isEllipsisBefore || isEllipsisAfter) {
                      return (
                        <span key={`ell-${p}`} className="page-ellipsis">
                          …
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="pagination-nav-btn"
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </nav>
          )}
        </div>
      )}

      <style>{`
        .feed-container {
          max-width: var(--container-width);
          margin: 0 auto;
          padding: 2rem 1.25rem 6rem;
        }

        .search-results-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding: 0.85rem 1.25rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .search-banner-text {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
          color: var(--text-main);
        }

        .search-count-badge {
          font-size: 0.8rem;
          color: var(--text-muted);
          background: var(--bg-subtle);
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-pill);
        }

        .clear-search-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.825rem;
          color: var(--text-muted);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-pill);
          border: 1px solid var(--border-muted);
          transition: all 0.15s ease;
          background: transparent;
        }

        .clear-search-pill:hover {
          color: var(--text-main);
          border-color: var(--text-muted);
          background: var(--bg-subtle);
        }

        /* Featured Hero Story */
        .featured-hero-card {
          padding: 2.25rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          margin-bottom: 2.5rem;
          cursor: pointer;
          border: 1px solid var(--border-subtle);
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .featured-hero-card:hover {
          border-color: var(--border-muted);
        }

        .featured-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent-primary);
          margin-bottom: 0.75rem;
        }

        .featured-hero-title {
          font-family: var(--font-serif);
          font-size: 2.1rem;
          font-weight: 700;
          line-height: 1.25;
          margin-bottom: 0.85rem;
          letter-spacing: -0.015em;
        }

        .featured-hero-card:hover .featured-hero-title {
          color: var(--accent-primary);
        }

        .featured-hero-excerpt {
          font-size: 1.05rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 1.25rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .featured-hero-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.825rem;
          color: var(--text-muted);
        }

        .featured-author {
          font-weight: 600;
          color: var(--text-main);
        }

        .stories-stream {
          max-width: var(--content-width);
          margin: 0 auto;
        }

        /* Pagination Bar */
        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 3.5rem;
          padding-top: 1.75rem;
          border-top: 1px solid var(--border-subtle);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .pagination-info {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .pagination-info span {
          font-weight: 600;
          color: var(--text-main);
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .pagination-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.85rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-main);
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .pagination-nav-btn:hover:not(:disabled) {
          border-color: var(--border-muted);
          background: var(--bg-subtle);
        }

        .pagination-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-pages {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin: 0 0.25rem;
        }

        .page-number-btn {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .page-number-btn:hover:not(:disabled) {
          color: var(--text-main);
          background: var(--bg-subtle);
        }

        .page-number-btn.active {
          background: var(--accent-primary);
          color: #fff;
          font-weight: 600;
        }

        .page-ellipsis {
          padding: 0 0.25rem;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        /* Empty Feed */
        .empty-feed-card {
          max-width: 520px;
          margin: 3.5rem auto;
          text-align: center;
          padding: 3rem 2rem;
          border: 1px dashed var(--border-muted);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
        }

        .empty-icon-halo {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--bg-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem auto;
          color: var(--text-muted);
        }

        .empty-title {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          margin-bottom: 0.5rem;
        }

        .empty-desc {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.55;
          margin-bottom: 1.75rem;
        }

        .empty-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        /* Skeletons */
        .story-card-skeleton {
          padding: 1.75rem 0;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .skeleton-line {
          height: 16px;
          background: var(--bg-subtle);
          border-radius: 4px;
        }

        .skeleton-line.sm { width: 30%; height: 14px; }
        .skeleton-line.lg { width: 85%; height: 24px; }
        .skeleton-line.md { width: 65%; height: 16px; }
      `}</style>
    </div>
  );
};
