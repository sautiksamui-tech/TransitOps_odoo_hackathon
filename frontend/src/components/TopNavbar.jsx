import React, { useState, useEffect } from 'react';

export default function TopNavbar({ collapsed, onToggleSidebar, activePage, userName = 'Administrator', onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    // Read theme from localStorage or document
    const savedTheme = localStorage.getItem('wa_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('wa_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard':
        return 'Operations Dashboard';
      case 'users':
        return 'User Management';
      case 'add-user':
        return 'Add User';
      case 'vehicle':
        return 'Vehicle Fleet';
      default:
        return activePage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' (Preview)';
    }
  };

  return (
    <nav className="top-navbar">
      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-link sidebar-toggle p-0" onClick={onToggleSidebar}>
          <i className="fas fa-bars fs-5"></i>
        </button>
        <h5 className="page-title mb-0 d-none d-sm-block">{getPageTitle()}</h5>
      </div>
      <div className="d-flex align-items-center gap-3">
        {/* Operations Period */}
        <div className="dropdown">
          <button
            className="btn btn-sm btn-outline-primary dropdown-toggle"
            type="button"
            onClick={() => setSessionOpen(!sessionOpen)}
            onBlur={() => setTimeout(() => setSessionOpen(false), 200)}
          >
            <i className="fas fa-calendar-alt me-1"></i>FY 2026-2027
          </button>
          <ul className={`dropdown-menu dropdown-menu-end shadow-sm ${sessionOpen ? 'show' : ''}`} style={{ display: sessionOpen ? 'block' : 'none' }}>
            <li><a className="dropdown-item active" href="#">FY 2026-2027</a></li>
            <li><a className="dropdown-item" href="#">FY 2025-2026</a></li>
          </ul>
        </div>

        <span className="text-muted small d-none d-md-inline">{timeStr}</span>

        {/* Theme Toggle */}
        <button
          className="btn btn-outline-secondary btn-sm theme-toggle d-flex align-items-center gap-1"
          onClick={toggleTheme}
          type="button"
          style={{ minWidth: '100px', justifyContent: 'center' }}
        >
          <i className={theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}></i>
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        {/* Role Chip */}
        <div className="role-chip role-chip-company d-flex align-items-center gap-1 px-2 py-1 rounded-2">
          <i className="fas fa-truck-moving" style={{ fontSize: '12px' }}></i>
          <span className="small fw-semibold">Ops Admin</span>
        </div>

        {/* Notifications */}
        <div className="dropdown">
          <button className="btn btn-outline-secondary btn-sm">
            <i className="fas fa-bell"></i>
          </button>
        </div>

        {/* User Dropdown */}
        <div className="dropdown">
          <button
            className="btn btn-outline-secondary btn-sm dropdown-toggle d-flex align-items-center gap-1"
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
          >
            <i className="fas fa-user-circle"></i>
            <span className="d-none d-md-inline">{userName}</span>
          </button>
          <ul
            className={`dropdown-menu dropdown-menu-end ${dropdownOpen ? 'show' : ''}`}
            style={{ minWidth: '220px', display: dropdownOpen ? 'block' : 'none', position: 'absolute', right: 0 }}
          >
            <li>
              <span className="dropdown-item-text small text-muted">
                Signed in as <strong>{userName}</strong><br />
                <em>Ops Administrator</em>
                <br />
                <span className="badge bg-primary-subtle text-primary mt-1" style={{ fontSize: '.65rem' }}>
                  Admin · Full permissions
                </span>
              </span>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li><a className="dropdown-item text-danger" href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}><i className="fas fa-sign-out-alt me-2"></i>Logout</a></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
