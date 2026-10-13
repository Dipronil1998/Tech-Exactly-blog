import { useState } from 'react';
import { api } from '../api/client';
import { ShieldAlert, Trash2, ArrowUpDown, UserCheck, Search } from 'lucide-react';

export const UsersTable = ({ users = [], onRefresh, currentUserId }) => {
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q)
    );
  });

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setLoadingId(user._id);
    setStatusMsg('');
    try {
      await api.updateUserRole(user._id, newRole);
      setStatusMsg(`Updated ${user.username}'s role to ${newRole}`);
      await onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.username}" and all their posts?`)) {
      return;
    }
    setLoadingId(user._id);
    try {
      await api.deleteUser(user._id);
      setStatusMsg(`User ${user.username} deleted.`);
      await onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="management-panel glass-panel">
      <div className="panel-header">
        <div>
          <h3>User Management</h3>
          <p className="panel-desc">Manage system roles, promote/demote users, and manage accounts.</p>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or username..."
          />
        </div>
      </div>

      {statusMsg && <div className="status-banner">{statusMsg}</div>}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No users found matching query.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSelf = currentUserId === u._id;
                return (
                  <tr key={u._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-sm">
                          {(u.name?.[0] || u.username?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                          <div className="user-cell-name">{u.name || u.username}</div>
                          <div className="user-cell-handle">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons-cell">
                        {!isSelf ? (
                          <>
                            <button
                              onClick={() => handleToggleRole(u)}
                              disabled={loadingId === u._id}
                              className="btn-action"
                              title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                            >
                              <ArrowUpDown size={14} />
                              {u.role === 'admin' ? 'Demote' : 'Promote'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={loadingId === u._id}
                              className="btn-danger"
                              title="Delete user"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="self-tag">(Current Admin)</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .management-panel {
          padding: 1.5rem;
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .panel-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .search-box {
          position: relative;
          min-width: 280px;
        }
        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-faint);
        }
        .search-box input {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          padding: 0.5rem 0.75rem 0.5rem 2.25rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          outline: none;
        }
        .status-banner {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--accent-emerald);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.825rem;
          margin-bottom: 1rem;
        }
        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .user-avatar-sm {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--gradient-admin);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }
        .user-cell-name {
          font-weight: 600;
        }
        .user-cell-handle {
          font-size: 0.775rem;
          color: var(--text-muted);
        }
        .action-buttons-cell {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          align-items: center;
        }
        .self-tag {
          font-size: 0.775rem;
          color: var(--text-faint);
          font-style: italic;
        }
        .empty-state {
          text-align: center;
          color: var(--text-muted);
          padding: 2.5rem !important;
        }
      `}</style>
    </div>
  );
};
