import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import Dashboard from './pages/Dashboard';
import UserList from './pages/UserList';
import AddUser from './pages/AddUser';
import Login from './pages/Login';
import './App.css';

const INITIAL_USERS = [
  { id: 1, name: 'Priya Sharma', email: 'priya@transitops.com', phone: '9876543210', role: 'Teacher', linkedStaff: 'Priya Sharma', status: 'Active', addedDate: '01 Jul 2026' },
  { id: 2, name: 'Anil Singh', email: 'anil@transitops.com', phone: '9876543211', role: 'Accountants', status: 'Active', addedDate: '03 Jul 2026' },
  { id: 3, name: 'Sunita Verma', email: 'sunita@transitops.com', phone: '9876543212', role: 'Operator', status: 'Inactive', addedDate: '05 Jul 2026' },
  { id: 4, name: 'Rajesh Gupta', email: 'rajesh@transitops.com', phone: '9876543213', role: 'Operator', status: 'Active', addedDate: '10 Jul 2026' },
];

const INITIAL_STATS = {
  vehicles: 18,
  activeRoutes: 12,
  operators: 20,
  activeTrips: 6,
  maintenanceJobs: 3,
  completedTrips: 154,
};

const INITIAL_ACTIVITY = [
  { action: 'INSERT', module: 'users', entity_type: 'operator', title: 'Operator added: Rajesh Gupta (rajesh@transitops.com)', timestamp: '12:10:45' },
  { action: 'UPDATE', module: 'dispatch', entity_type: 'vehicle', title: 'Dispatched vehicle VO-402 on Route 10A', timestamp: '09:30:12' },
  { action: 'INSERT', module: 'maintenance', entity_type: 'job', title: 'Created maintenance ticket for Vehicle VO-108', timestamp: '08:15:00' },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [activityLog, setActivityLog] = useState(INITIAL_ACTIVITY);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    showToast('info', 'Logged out successfully.');
  };

  const fetchUsers = () => {
    fetch('/api/users')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then((data) => {
        if (data.status === 'success') {
          const mappedUsers = data.users.map((u) => ({
            id: u.ID,
            name: u.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A',
            email: u.email,
            phone: 'N/A',
            role: u.RoleName || 'Operator',
            status: 'Active',
            addedDate: '12 Jul 2026'
          }));
          setUsers(mappedUsers);

          // Update stats operator count
          setStats((prev) => ({
            ...prev,
            operators: data.users.length,
          }));
        }
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
      });
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchUsers();
    }
  }, [isLoggedIn]);

  const handleToggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
          showToast('info', `User ${u.name} status updated to ${nextStatus}.`);
          // Add to activity log
          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'UPDATE',
              module: 'users',
              entity_type: 'user',
              title: `User ${u.name} status changed to ${nextStatus}`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleDeleteUser = (id) => {
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) return;
    if (window.confirm(`Are you sure you want to permanently delete user ${userToDelete.name}?`)) {
      fetch('/api/remove_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userID: id })
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to delete user');
          return res.json();
        })
        .then((data) => {
          if (data.status === 'success') {
            showToast('error', `User ${userToDelete.name} has been deleted.`);
            fetchUsers();
            const now = new Date();
            setActivityLog(logs => [
              {
                action: 'DELETE',
                module: 'users',
                entity_type: 'user',
                title: `User deleted: ${userToDelete.name} (${userToDelete.email})`,
                timestamp: now.toTimeString().split(' ')[0]
              },
              ...logs
            ]);
          } else {
            showToast('error', data.message || 'Failed to delete user.');
          }
        })
        .catch((err) => {
          showToast('error', err.message);
        });
    }
  };

  const handleAddUser = (newUserData) => {
    fetch('/api/add_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: newUserData.email,
        password: newUserData.password,
        roleID: newUserData.roleID
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to create user');
        }
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', `User ${newUserData.name} added successfully.`);
          fetchUsers();
          setActivePage('users');

          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'INSERT',
              module: 'users',
              entity_type: 'user',
              title: `User added: ${newUserData.name} (${newUserData.email})`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
        } else {
          showToast('error', data.message || 'Failed to add user.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  if (!isLoggedIn) {
    return (
      <div className="login-root">
        {toast && (
          <div className={`notif-toast ${toast.type}`}>
            <div className="notif-icon">
              {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
              {toast.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
              {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
            </div>
            <div className="notif-body text-start">{toast.message}</div>
            <button className="notif-close" onClick={() => setToast(null)}>&times;</button>
          </div>
        )}
        <Login onLoginSuccess={() => {
          setIsLoggedIn(true);
          showToast('success', 'Logged in successfully as Administrator.');
        }} />
      </div>
    );
  }

  return (
    <div className="wrapper">
      {/* Toast Notification Container */}
      {toast && (
        <div className={`notif-toast ${toast.type}`}>
          <div className="notif-icon">
            {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
            {toast.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
            {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
          </div>
          <div className="notif-body text-start">{toast.message}</div>
          <button className="notif-close" onClick={() => setToast(null)}>&times;</button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        activePage={activePage}
        onChangePage={setActivePage}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <TopNavbar
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          activePage={activePage}
          onLogout={handleLogout}
        />

        <div className="container-fluid py-4 px-3" style={{ flexGrow: 1 }}>
          {activePage === 'dashboard' && (
            <Dashboard
              stats={stats}
              onNavigate={setActivePage}
              activityLog={activityLog}
            />
          )}

          {activePage === 'users' && (
            <UserList
              users={users}
              onToggleStatus={handleToggleStatus}
              onDeleteUser={handleDeleteUser}
              onAddUserClick={() => setActivePage('add-user')}
            />
          )}

          {activePage === 'add-user' && (
            <AddUser
              onAddUser={handleAddUser}
              onCancel={() => setActivePage('users')}
            />
          )}

          {/* Under construction fallbacks for other menus */}
          {activePage !== 'dashboard' && activePage !== 'users' && activePage !== 'add-user' && (
            <div className="row justify-content-center align-items-center py-5">
              <div className="col-12 col-md-8 col-lg-6 text-center">
                <div className="card border-0 shadow-sm p-5" style={{ borderRadius: '16px' }}>
                  <i className="fas fa-tools fa-3x text-primary mb-3"></i>
                  <h4 className="fw-bold mb-2">Module Preview</h4>
                  <p className="text-muted mb-4">
                    The <strong>{activePage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</strong> module is currently in mock preview mode.
                  </p>
                  <button className="btn btn-primary" onClick={() => setActivePage('dashboard')}>
                    <i className="fas fa-arrow-left me-2"></i>Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
