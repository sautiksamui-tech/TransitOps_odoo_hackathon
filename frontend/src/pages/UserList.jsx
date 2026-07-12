import React, { useState } from 'react';

export default function UserList({ users, onToggleStatus, onDeleteUser, onAddUserClick }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate statistics
  const totalUsers = users.length;
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  // Filtered users
  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.phone && user.phone.toLowerCase().includes(q)) ||
      user.role.toLowerCase().includes(q)
    );
  });

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Ops Manager':
        return 'bg-danger';
      case 'Driver / Crew':
        return 'bg-success';
      case 'Dispatcher':
        return 'bg-warning text-dark';
      case 'Maintenance Crew':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div className="container-fluid py-3 text-start">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h5 className="mb-0 fw-bold"><i className="fas fa-users-cog me-2 text-primary"></i>Operator Management</h5>
          <p className="text-muted small mb-0 mt-1">Manage system operators and control room personnel</p>
        </div>
        <button className="btn btn-primary" onClick={onAddUserClick}>
          <i className="fas fa-user-plus me-2"></i>Add Operator
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card stat-blue text-center py-3">
            <h4 className="mb-0">{totalUsers}</h4>
            <p className="mb-0 small">Total Operators</p>
            <i className="fas fa-users-shield stat-icon"></i>
          </div>
        </div>
        {Object.entries(roleCounts).map(([roleName, count], idx) => {
          const colors = ['stat-green', 'stat-orange', 'stat-purple', 'stat-blue'];
          const statCls = colors[idx % colors.length];
          return (
            <div className="col-6 col-md-3" key={roleName}>
              <div className={`stat-card ${statCls} text-center py-3`}>
                <h4 className="mb-0">{count}</h4>
                <p className="mb-0 small">{roleName}</p>
                <i className="fas fa-user-tag stat-icon"></i>
              </div>
            </div>
          );
        })}
      </div>

      {/* Users Table Card */}
      <div className="card border-0 shadow-sm">
        <div className="card-header d-flex align-items-center justify-content-between bg-transparent py-3">
          <span className="fw-semibold"><i className="fas fa-list me-2"></i>All Operators ({filteredUsers.length})</span>
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ maxWidth: '220px' }}
            placeholder="🔍 Search Operators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '5%' }}>#</th>
                  <th style={{ width: '30%' }}>Name</th>
                  <th style={{ width: '25%' }}>Email Address</th>
                  <th style={{ width: '20%' }}>Role</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '10%' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-5">
                      <i className="fas fa-users-cog fa-2x mb-2 d-block opacity-25"></i>
                      No operators found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const isActive = u.status === 'Active';
                    return (
                      <tr key={u.id}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{
                                width: '34px',
                                height: '34px',
                                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                              }}
                            >
                              <span className="text-white fw-bold small">{u.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <strong className="text-dark">{u.name}</strong>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>{u.email}</div>
                        </td>
                        <td>
                          <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                            <i className="fas fa-user-shield me-1"></i>{u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end align-items-center">
                            <button
                              className={`btn btn-xs ${isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              onClick={() => onToggleStatus(u.id)}
                              title={isActive ? 'Deactivate' : 'Activate'}
                            >
                              <i className={`fas ${isActive ? 'fa-ban' : 'fa-check'}`}></i>
                            </button>
                            <button
                              className="btn btn-xs btn-outline-danger"
                              onClick={() => onDeleteUser(u.id)}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
