export const StatCard = ({
  title,
  value,
  icon: Icon,
  _variant = 'users',
  subtitle,
  badgeText,
  badgeType = 'positive',
}) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div className="stat-icon-wrapper">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="stat-card-body">
        <div className="stat-value">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {badgeText && (
          <span className={`stat-badge stat-badge-${badgeType}`}>
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && <p className="stat-subtitle">{subtitle}</p>}

      <style>{`
        .stat-card {
          padding: 1.25rem 1.5rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: border-color 0.15s ease;
        }

        .stat-card:hover {
          border-color: var(--border-muted);
        }

        .stat-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-title {
          font-size: 0.825rem;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .stat-icon-wrapper {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-pill);
          background: var(--bg-subtle);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-card-body {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
        }

        .stat-value {
          font-family: var(--font-serif);
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1.1;
        }

        .stat-badge {
          font-size: 0.72rem;
          font-weight: 500;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-pill);
          background: var(--bg-subtle);
          color: var(--text-muted);
        }

        .stat-badge-positive {
          background: var(--accent-light);
          color: var(--accent-primary);
        }

        .stat-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
};
