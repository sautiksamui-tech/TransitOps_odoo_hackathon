import React from 'react';

const SIDEBAR_ITEMS = [
  { key: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
  { key: 'users', icon: 'fas fa-users-cog', label: 'Users' },
  { key: 'vehicle', icon: 'fas fa-bus', label: 'Vehicle' },
];

export default function Sidebar({ collapsed, activePage, onChangePage, onLogout }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} id="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px' }}>
        <div style={{ flex: 1, minWidth: 0 }} className="logo-text">
          <div style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.5px', color: 'var(--primary)' }}>
            TransitOps
          </div>
          <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Operations Portal</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <ul className="nav flex-column">
          {SIDEBAR_ITEMS.map((item) => {
            const isPageActive = activePage === item.key || (item.key === 'users' && activePage === 'add-user');
            return (
              <li className="nav-item" key={item.key}>
                <a
                  className={`nav-link ${isPageActive ? 'active' : ''}`}
                  onClick={() => onChangePage(item.key)}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-footer-content">
          <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="btn btn-sm btn-outline-danger w-100 mb-3" style={{ borderRadius: 'var(--radius-sm)' }}>
            <i className="fas fa-sign-out-alt me-1"></i> Logout
          </a>
          <div className="d-flex flex-column align-items-center text-center gap-1 pt-2 border-top" style={{ borderColor: 'var(--border-color)' }}>

            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              &copy; {new Date().getFullYear()} All rights reserved
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
