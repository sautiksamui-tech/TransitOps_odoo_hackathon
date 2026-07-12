import React, { useState, useEffect } from 'react';

const ROLES = [
  { id: 2, name: 'Ops Manager', position: 'admin', description: 'Full access to all fleet, dispatch, and operator modules' },
  { id: 3, name: 'Driver / Crew', position: 'teacher', description: 'Operational access to log trips, mileage, and vehicle issues' },
  { id: 4, name: 'Dispatcher', position: 'accountant', description: 'Access to schedule runs, allocate routes, and view trip logs' },
  { id: 5, name: 'Maintenance Crew', position: 'operator', description: 'Access to log repairs, maintenance logs, and vehicle inspections' }
];

const STAFF_MEMBERS = [
  { id: 1, name: 'Ramesh Kumar', email: 'ramesh@transitops.com' },
  { id: 2, name: 'Priya Sharma', email: 'priya@transitops.com' },
  { id: 3, name: 'Anil Singh', email: 'anil@transitops.com' },
  { id: 4, name: 'Sunita Verma', email: 'sunita@transitops.com' }
];

const ROLE_PERMISSIONS = {
  2: { // Ops Manager
    fleet: ['view', 'create', 'edit', 'delete'],
    dispatch: ['view', 'create', 'edit', 'delete'],
    maintenance: ['view', 'create', 'edit', 'delete'],
    users: ['edit', 'delete']
  },
  3: { // Driver / Crew
    fleet: ['view'],
    dispatch: ['trip-log', 'route-view'],
    maintenance: ['report-issue']
  },
  4: { // Dispatcher
    dispatch: ['view', 'create', 'edit'],
    fleet: ['view', 'route-assign'],
    users: ['view']
  },
  5: { // Maintenance Crew
    maintenance: ['view', 'create', 'edit'],
    fleet: ['view', 'status-update']
  }
};

const GROUP_COLORS = {
  fleet: '#0d6efd',
  dispatch: '#198754',
  maintenance: '#ffc107',
  users: '#475569'
};

export default function AddUser({ onAddUser, onCancel }) {
  const [dbRoles, setDbRoles] = useState([]);
  const [roleId, setRoleId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ipLockType, setIpLockType] = useState('any');
  const [allowedIp, setAllowedIp] = useState('');
  const [timeLockType, setTimeLockType] = useState('any');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [emailOtp, setEmailOtp] = useState(false);
  const [whatsappOtp, setWhatsappOtp] = useState(false);

  useEffect(() => {
    fetch('/api/roles')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const mapped = data.roles.map(r => {
            const staticMatch = ROLES.find(sr => sr.name.toLowerCase() === r.RoleName.toLowerCase());
            return {
              id: r.roleID,
              name: r.RoleName,
              position: staticMatch ? staticMatch.position : 'operator',
              description: staticMatch ? staticMatch.description : 'Access for custom role'
            };
          });
          setDbRoles(mapped);
        }
      })
      .catch(err => {
        console.error('Error fetching roles in AddUser:', err);
      });
  }, []);

  const activeRoles = dbRoles.length > 0 ? dbRoles : ROLES;

  const [errors, setErrors] = useState([]);
  const [pwdVisible, setPwdVisible] = useState(false);
  const [pwdConfirmVisible, setPwdConfirmVisible] = useState(false);
  const [pwdMatchHint, setPwdMatchHint] = useState({ text: '', class: '' });

  // Auto-fill form when staff is selected
  useEffect(() => {
    if (staffId) {
      const selected = STAFF_MEMBERS.find(s => s.id === parseInt(staffId));
      if (selected) {
        setName(selected.name);
        setEmail(selected.email);
      }
    }
  }, [staffId]);

  // Handle password matching hint
  useEffect(() => {
    if (!confirmPassword) {
      setPwdMatchHint({ text: '', class: '' });
      return;
    }
    if (confirmPassword === password) {
      setPwdMatchHint({ text: '✓ Passwords match', class: 'text-success' });
    } else {
      setPwdMatchHint({ text: '✗ Passwords do not match', class: 'text-danger' });
    }
  }, [password, confirmPassword]);

  // Reset staff selection when role changes
  useEffect(() => {
    const selectedRole = activeRoles.find(r => r.id === parseInt(roleId));
    if (!selectedRole || selectedRole.position !== 'teacher') {
      setStaffId('');
    }
  }, [roleId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = [];

    if (!roleId) errs.push('Role is required.');
    if (!name.trim()) errs.push('Full name is required.');
    if (!email.trim()) errs.push('Email is required.');
    else if (!/\S+@\S+\.\S+/.test(email)) errs.push('Invalid email format.');

    if (!password) errs.push('Password is required.');
    else if (password.length < 6) errs.push('Password must be at least 6 characters.');
    else if (password !== confirmPassword) errs.push('Passwords do not match.');

    const selectedRole = activeRoles.find(r => r.id === parseInt(roleId));
    if (selectedRole && selectedRole.position === 'teacher' && !staffId) {
      errs.push('A crew member must be selected for the Operational role.');
    }

    if (ipLockType === 'my_ip') {
      if (!allowedIp.trim()) {
        errs.push('An IP address is required for Specific IP locking.');
      } else if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(allowedIp.trim())) {
        // Simple IPv4 regex validation
        errs.push('Invalid IP address format.');
      }
    }

    if (timeLockType === 'specific') {
      if (!startTime || !endTime) {
        errs.push('Both start and end times are required for Specific Time locking.');
      }
    }

    if (errs.length > 0) {
      setErrors(errs);
      window.scrollTo(0, 0);
      return;
    }

    // Call submit handler with data
    const roleData = activeRoles.find(r => r.id === parseInt(roleId));
    const linkedStaffObj = STAFF_MEMBERS.find(s => s.id === parseInt(staffId));
    onAddUser({
      name,
      email,
      phone,
      password,
      roleID: parseInt(roleId),
      role: roleData ? roleData.name : 'Custom',
      linkedStaff: linkedStaffObj ? linkedStaffObj.name : null,
      status: 'Active',
      addedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      security: {
        ipLockType,
        allowedIp: ipLockType === 'my_ip' ? allowedIp : null,
        timeLockType,
        startTime: timeLockType === 'specific' ? startTime : null,
        endTime: timeLockType === 'specific' ? endTime : null,
        emailOtp,
        whatsappOtp
      }
    });
  };

  const selectedPermissions = roleId ? (ROLE_PERMISSIONS[roleId] || ROLE_PERMISSIONS[2]) : null;

  return (
    <div className="container-fluid py-3 text-start">
      {/* Page Title & Back */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <button onClick={onCancel} className="btn btn-sm btn-outline-secondary">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h5 className="mb-0 fw-bold"><i className="fas fa-user-plus me-2 text-primary"></i>Add New User</h5>
          <p className="text-muted small mb-0">Create a TransitOps system or operator account</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <ul className="mb-0 ps-3">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
          <button type="button" className="btn-close" onClick={() => setErrors([])}></button>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <h6 className="fw-semibold text-muted text-uppercase" style={{ fontSize: '.7rem', letterSpacing: '.1em' }}>
                <i className="fas fa-id-card me-1"></i> User Details
              </h6>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="row g-3">
                  {/* Select Role */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Assign Role <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="fas fa-shield-alt text-muted"></i></span>
                      <select
                        name="role_id"
                        className="form-select"
                        required
                        value={roleId}
                        onChange={(e) => setRoleId(e.target.value)}
                      >
                        <option value="">-- Select Role --</option>
                        {activeRoles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <small className="text-muted">Controls what this user can access</small>
                  </div>

                  {/* Staff Select (Only visible if role position is teacher) */}
                  {roleId && activeRoles.find(r => r.id === parseInt(roleId))?.position === 'teacher' && (
                    <div className="col-md-6" id="staffSelectGroup">
                      <label className="form-label fw-semibold">Link Fleet Personnel <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="fas fa-id-badge text-muted"></i></span>
                        <select
                          name="staff_id"
                          className="form-select"
                          required
                          value={staffId}
                          onChange={(e) => setStaffId(e.target.value)}
                        >
                          <option value="">-- Select Fleet Personnel --</option>
                          {STAFF_MEMBERS.map((sm) => (
                            <option key={sm.id} value={sm.id}>{sm.name}</option>
                          ))}
                        </select>
                      </div>
                      <small className="text-muted">Required for operational staff login accounts</small>
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="fas fa-user text-muted"></i></span>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email Address <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="fas fa-envelope text-muted"></i></span>
                      <input
                        type="email"
                        className="form-control"
                        required
                        placeholder="user@transitops.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone (optional)</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="fas fa-phone text-muted"></i></span>
                      <input
                        type="tel"
                        className="form-control"
                        maxLength="15"
                        placeholder="10-digit mobile"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Password <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="fas fa-lock text-muted"></i></span>
                      <input
                        type={pwdVisible ? 'text' : 'password'}
                        className="form-control"
                        required
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setPwdVisible(!pwdVisible)}
                      >
                        <i className={`fas ${pwdVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Confirm Password <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="fas fa-check-circle text-muted"></i></span>
                      <input
                        type={pwdConfirmVisible ? 'text' : 'password'}
                        className="form-control"
                        required
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setPwdConfirmVisible(!pwdConfirmVisible)}
                      >
                        <i className={`fas ${pwdConfirmVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    {pwdMatchHint.text && (
                      <small className={`small d-block mt-1 ${pwdMatchHint.class}`}>{pwdMatchHint.text}</small>
                    )}
                  </div>
                </div>

                <hr className="my-4" />
                <h6 className="fw-semibold mb-3 text-secondary text-uppercase" style={{ fontSize: '.75rem', letterSpacing: '.05em' }}>
                  <i className="fas fa-user-lock me-1"></i> Security & Access Restrictions
                </h6>

                <div className="row g-3">
                  {/* IP Restriction */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">IP Access Restriction</label>
                    <select
                      className="form-select"
                      value={ipLockType}
                      onChange={(e) => setIpLockType(e.target.value)}
                    >
                      <option value="any">Any IP (No Lock)</option>
                      <option value="my_ip">Specific IP Only</option>
                      <option value="school_ips">Corporate Allowed IPs Only</option>
                    </select>
                    <small className="text-muted d-block mt-1">Configure corporate IPs in settings</small>
                  </div>

                  {ipLockType === 'my_ip' && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Allowed IP Address</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 192.168.1.1"
                        value={allowedIp}
                        onChange={(e) => setAllowedIp(e.target.value)}
                      />
                      <small className="text-muted">User can login only from this IP address</small>
                    </div>
                  )}

                  {/* Time Restriction */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Time Access Restriction</label>
                    <select
                      className="form-select"
                      value={timeLockType}
                      onChange={(e) => setTimeLockType(e.target.value)}
                    >
                      <option value="any">Any Time</option>
                      <option value="specific">Specific Business Hours Only</option>
                    </select>
                    <small className="text-muted">Restrict when this user can log in</small>
                  </div>

                  {timeLockType === 'specific' && (
                    <div className="col-md-6">
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label fw-semibold small">Start Time</label>
                          <input
                            type="time"
                            className="form-control"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label fw-semibold small">End Time</label>
                          <input
                            type="time"
                            className="form-control"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Two-Factor Authentication Options */}
                  <div className="col-12 mt-3">
                    <label className="form-label fw-semibold d-block">Two-Factor Authentication (OTP)</label>
                    <div className="d-flex gap-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="emailOtp"
                          checked={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.checked)}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="emailOtp">
                          <i className="fas fa-envelope text-primary me-1"></i> Email OTP
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="whatsappOtp"
                          checked={whatsappOtp}
                          onChange={(e) => setWhatsappOtp(e.target.checked)}
                        />
                        <label className="form-check-label fw-semibold text-success" htmlFor="whatsappOtp">
                          <i className="fab fa-whatsapp me-1"></i> WhatsApp OTP
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="my-4" />
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary px-4">
                    <i className="fas fa-save me-2"></i>Create User
                  </button>
                  <button type="button" className="btn btn-outline-secondary px-4" onClick={onCancel}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Pane: Role Permissions Panel */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-2">
              <h6 className="fw-semibold mb-0">
                <i className="fas fa-shield-alt me-2 text-primary"></i>
                Role Permissions Preview
              </h6>
              <small className="text-muted">
                {roleId ? activeRoles.find(r => r.id === parseInt(roleId))?.name : 'Select a role to see its permissions'}
              </small>
            </div>
            <div className="card-body p-4 pt-2">
              {!roleId || !selectedPermissions ? (
                <div className="text-center text-muted py-5">
                  <i className="fas fa-hand-point-up fa-2x mb-2 opacity-25 d-block"></i>
                  Choose a role from the form to preview permissions
                </div>
              ) : (
                <div>
                  <p className="text-muted small mb-3">
                    {activeRoles.find(r => r.id === parseInt(roleId))?.description}
                  </p>
                  <div className="d-flex flex-column gap-2">
                    {Object.entries(selectedPermissions).map(([group, actions]) => {
                      const color = GROUP_COLORS[group] || '#6c757d';
                      return (
                        <div className="d-flex align-items-center flex-wrap gap-1 mb-2" key={group}>
                          <span
                            className="fw-bold text-uppercase me-2 text-start"
                            style={{ fontSize: '.6rem', color: color, minWidth: '66px' }}
                          >
                            {group}
                          </span>
                          {actions.map((act) => (
                            <span
                              key={act}
                              className="badge rounded-pill"
                              style={{
                                background: `${color}18`,
                                color: color,
                                fontSize: '.62rem',
                                border: `1px solid ${color}35`,
                              }}
                            >
                              {act}
                            </span>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
