import { useState, useRef } from 'react';
import { api } from '../api/client';
import { calculateReadTime } from '../utils/readingUtils';
import {
  ArrowLeft,
  Eye,
  Edit2,
  Send,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
} from 'lucide-react';

export const StoryEditor = ({ initialPost, onCancel, onSaved }) => {
  const [title, setTitle] = useState(initialPost?.title || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [status, setStatus] = useState(initialPost?.status || 'published');
  const [isPreview, setIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  const isEditing = !!initialPost?._id || !!initialPost?.id;
  const postId = initialPost?._id || initialPost?.id;

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = calculateReadTime(content);

  // Markdown helper
  const insertFormatting = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 4)
      );
    }, 10);
  };

  const handleSave = async (submitStatus = status) => {
    if (!title.trim()) {
      setError('Please provide a title for your story.');
      return;
    }
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    if (!content.trim() || content.trim().length < 5) {
      setError('Content must be at least 5 characters long.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let savedPost;
      if (isEditing) {
        const res = await api.updatePost(postId, {
          title: title.trim(),
          content: content.trim(),
          status: submitStatus,
        });
        savedPost = res.data?.post || { ...initialPost, title, content, status: submitStatus };
      } else {
        const res = await api.createPost({
          title: title.trim(),
          content: content.trim(),
          status: submitStatus,
        });
        savedPost = res.data?.post;
      }

      onSaved(savedPost);
    } catch (err) {
      setError(err.message || 'Failed to save story. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="editor-container animate-fade-in">
      {/* Editor Top Navigation */}
      <div className="editor-nav">
        <div className="editor-nav-left">
          <button onClick={onCancel} className="btn-ghost-back" title="Leave editor">
            <ArrowLeft size={16} />
            <span>Cancel</span>
          </button>
          <span className="editor-divider">·</span>
          <span className="editor-stats">
            {wordCount} words · {readTime}
          </span>
        </div>

        <div className="editor-nav-right">
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="btn-preview-toggle"
          >
            {isPreview ? <Edit2 size={15} /> : <Eye size={15} />}
            <span>{isPreview ? 'Edit' : 'Preview'}</span>
          </button>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="status-select"
          >
            <option value="published">Publish publicly</option>
            <option value="draft">Save as Draft</option>
          </select>

          <button
            type="button"
            onClick={() => handleSave(status)}
            disabled={saving || !title.trim() || !content.trim()}
            className="btn-primary"
          >
            <Send size={14} />
            <span>
              {saving
                ? 'Saving...'
                : isEditing
                ? 'Save Story'
                : status === 'draft'
                ? 'Save Draft'
                : 'Publish'}
            </span>
          </button>
        </div>
      </div>

      {error && <div className="editor-error-banner">{error}</div>}

      {/* Editor Content Area */}
      <div className="editor-canvas">
        {isPreview ? (
          <div className="reader-canvas preview-mode">
            <div className="preview-indicator">Reader Preview Mode</div>
            <h1 className="reader-title">{title || 'Untitled Story'}</h1>
            <div className="reader-body">
              {content ? (
                content.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <p className="preview-empty">Your story content will appear here.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="editor-form">
            {/* Formatting Toolbar */}
            <div className="formatting-bar">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                title="Bold"
                className="toolbar-btn"
              >
                <Bold size={15} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                title="Italic"
                className="toolbar-btn"
              >
                <Italic size={15} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('## ', '')}
                title="Heading 2"
                className="toolbar-btn"
              >
                <Heading2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('### ', '')}
                title="Heading 3"
                className="toolbar-btn"
              >
                <Heading3 size={15} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('> ', '')}
                title="Blockquote"
                className="toolbar-btn"
              >
                <Quote size={15} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('```\n', '\n```')}
                title="Code block"
                className="toolbar-btn"
              >
                <Code size={15} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('- ', '')}
                title="Bullet List"
                className="toolbar-btn"
              >
                <List size={15} />
              </button>
            </div>

            {/* Title Input */}
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="editor-title-input"
              autoFocus
            />

            {/* Content Textarea */}
            <textarea
              ref={textareaRef}
              placeholder="Tell your story... You can use headings, quotes, bullet points and markdown."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="editor-content-textarea"
              rows={16}
            />
          </div>
        )}
      </div>

      <style>{`
        .editor-container {
          max-width: var(--container-width);
          margin: 0 auto;
          padding: 1.5rem 1.25rem 6rem;
        }

        .editor-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .editor-nav-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-ghost-back {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-muted);
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-pill);
        }

        .btn-ghost-back:hover {
          color: var(--text-main);
          background: var(--bg-subtle);
        }

        .editor-divider {
          color: var(--border-muted);
        }

        .editor-stats {
          font-size: 0.825rem;
          color: var(--text-muted);
        }

        .editor-nav-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-preview-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-muted);
          background: var(--bg-subtle);
          padding: 0.45rem 0.85rem;
          border-radius: var(--radius-pill);
          font-size: 0.85rem;
        }

        .btn-preview-toggle:hover {
          color: var(--text-main);
          background: var(--bg-hover);
        }

        .status-select {
          padding: 0.45rem 0.75rem;
          border-radius: var(--radius-pill);
          border: 1px solid var(--border-subtle);
          background: var(--bg-primary);
          color: var(--text-main);
          font-family: var(--font-sans);
          font-size: 0.825rem;
          outline: none;
        }

        .editor-error-banner {
          background: #ffebee;
          color: var(--accent-rose);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .editor-canvas {
          max-width: var(--content-width);
          margin: 0 auto;
        }

        .formatting-bar {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.4rem 0.5rem;
          background: var(--bg-subtle);
          border-radius: var(--radius-pill);
          margin-bottom: 1.5rem;
          width: fit-content;
        }

        .toolbar-btn {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-pill);
          color: var(--text-muted);
          transition: all 0.15s ease;
        }

        .toolbar-btn:hover {
          color: var(--text-main);
          background: var(--bg-hover);
        }

        .editor-title-input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-family: var(--font-serif);
          font-size: 2.35rem;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1.25;
          letter-spacing: -0.02em;
          margin-bottom: 1.5rem;
        }

        .editor-title-input::placeholder {
          color: var(--text-faint);
        }

        .editor-content-textarea {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-family: var(--font-serif);
          font-size: 1.25rem;
          line-height: 1.85;
          color: var(--text-main);
          resize: none;
          min-height: 450px;
        }

        .editor-content-textarea::placeholder {
          color: var(--text-faint);
        }

        .preview-indicator {
          display: inline-block;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent-primary);
          background: var(--accent-light);
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-pill);
          margin-bottom: 1.25rem;
          font-weight: 600;
        }

        .preview-empty {
          color: var(--text-muted);
          font-style: italic;
        }
      `}</style>
    </div>
  );
};
