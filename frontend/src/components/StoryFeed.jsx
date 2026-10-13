import { useState } from 'react';
import { StoryCard } from './StoryCard';
import { calculateReadTime, formatDate } from '../utils/readingUtils';
import { useAuth } from '../context/AuthContext';
import { PenLine, Compass } from 'lucide-react';

export const StoryFeed = ({
  posts,
  loading,
  searchQuery,
  onSelectStory,
  onEditStory,
  onDeleteStory,
  onOpenEditor,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Technology',
    'Design',
    'Engineering',
    'Mindset',
    ...(isAuthenticated ? ['My Stories', 'Drafts'] : []),
  ];

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title?.toLowerCase().includes(q);
      const matchContent = post.content?.toLowerCase().includes(q);
      const matchAuthor = (post.author?.name || post.author?.username || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }

    // Category filter
    if (selectedCategory === 'All') {
      return post.status !== 'draft' || (user && post.author?._id === user._id);
    }

    if (selectedCategory === 'My Stories') {
      return user && (post.author?._id === user._id || post.author?.username === user.username);
    }

    if (selectedCategory === 'Drafts') {
      return post.status === 'draft' && user && (post.author?._id === user._id || post.author?.username === user.username);
    }

    const text = `${post.title} ${post.content}`.toLowerCase();
    if (selectedCategory === 'Technology') return text.includes('tech') || text.includes('software') || text.includes('ai') || text.includes('data');
    if (selectedCategory === 'Design') return text.includes('design') || text.includes('ui') || text.includes('ux') || text.includes('minimal');
    if (selectedCategory === 'Engineering') return text.includes('code') || text.includes('react') || text.includes('api') || text.includes('system') || text.includes('javascript');
    if (selectedCategory === 'Mindset') return text.includes('life') || text.includes('mind') || text.includes('productivity') || text.includes('focus');

    return true;
  });

  // Featured Lead Story (the first published story)
  const featuredPost = filteredPosts.length > 0 && selectedCategory === 'All' && !searchQuery
    ? filteredPosts[0]
    : null;

  const standardPosts = featuredPost
    ? filteredPosts.slice(1)
    : filteredPosts;

  return (
    <div className="feed-container animate-fade-in">
      {/* Category Pills Bar */}
      <div className="category-bar">
        <div className="category-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`tag-pill ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Header if Active */}
      {searchQuery && (
        <div className="search-results-banner">
          <p>
            Showing results for <strong>"{searchQuery}"</strong> ({filteredPosts.length} {filteredPosts.length === 1 ? 'story' : 'stories'})
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="loading-feed">
          {[1, 2, 3].map((i) => (
            <div key={i} className="story-card-skeleton">
              <div className="skeleton-line sm"></div>
              <div className="skeleton-line lg"></div>
              <div className="skeleton-line md"></div>
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        /* Empty State */
        <div className="empty-feed-card">
          <div className="empty-icon-halo">
            <Compass size={32} />
          </div>
          <h3 className="empty-title">
            {searchQuery
              ? `No stories found for "${searchQuery}"`
              : selectedCategory !== 'All'
              ? `No stories in "${selectedCategory}" yet`
              : 'No stories published yet'}
          </h3>
          <p className="empty-desc">
            {searchQuery
              ? 'Try searching with different keywords or browse all categories.'
              : 'Be the first voice on The Chronicle by sharing your perspective with the world.'}
          </p>

          <div className="empty-actions">
            <button
              onClick={() => {
                if (!isAuthenticated) onOpenAuth('login');
                else onOpenEditor();
              }}
              className="btn-primary"
            >
              <PenLine size={16} />
              <span>Write a Story</span>
            </button>
          </div>
        </div>
      ) : (
        /* Story Feed List */
        <div className="stories-stream">
          {/* Featured Lead Hero (Medium style) */}
          {featuredPost && (
            <div
              className="featured-hero-card"
              onClick={() => onSelectStory(featuredPost)}
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
                onSelect={onSelectStory}
                onEdit={onEditStory}
                onDelete={onDeleteStory}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        .feed-container {
          max-width: var(--container-width);
          margin: 0 auto;
          padding: 1.5rem 1.25rem 6rem;
        }

        .category-bar {
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 0.85rem;
          margin-bottom: 2rem;
        }

        .category-scroll {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .search-results-banner {
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
          color: var(--text-muted);
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
          flex-wrap: wrap;
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
