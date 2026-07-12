import React, { useState, useEffect } from 'react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@transitops.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  const [roleId, setRoleId] = useState('');

  useEffect(() => {
    fetch('/api/roles')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch roles');
        return res.json();
      })
      .then((data) => {
        if (data.status === 'success') {
          setRoles(data.roles);
          if (data.roles && data.roles.length > 0) {
            setRoleId(data.roles[0].roleID.toString());
          }
        }
      })
      .catch((err) => {
        console.error('Fetch roles error:', err);
        // Fallback demo roles so app remains functional
        const fallbackRoles = [
          { roleID: 1, RoleName: 'Ops Admin' },
          { roleID: 2, RoleName: 'Driver / Crew' },
          { roleID: 3, RoleName: 'Dispatcher' }
        ];
        setRoles(fallbackRoles);
        setRoleId('1');
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim() || !roleId) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password.trim(),
        roleID: parseInt(roleId)
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Login failed');
        }
        return data;
      })
      .then((data) => {
        setLoading(false);
        if (data.status === 'success' && data.token) {
          localStorage.setItem('token', data.token);
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          onLoginSuccess();
        } else {
          setError(data.message || 'An unexpected response was returned.');
        }
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message || 'Failed to connect to authentication server.');
      });
  };

  return (
    <div className="login-wrapper" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--body-bg)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      padding: '20px'
    }}>
      {/* Decorative Blur Blobs for Glassmorphic Depth */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(11, 77, 187, 0.15) 0%, rgba(11, 77, 187, 0) 70%)',
        top: '-150px',
        left: '-150px',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(255, 122, 0, 0.1) 0%, rgba(255, 122, 0, 0) 70%)',
        bottom: '-150px',
        right: '-150px',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      {/* Main Login Card Container */}
      <div className="card shadow-lg border-0 overflow-hidden" style={{
        width: '1000px',
        maxWidth: '100%',
        borderRadius: '24px',
        background: 'var(--card-bg)',
        zIndex: 1,
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-color)'
      }}>
        <div className="row g-0">
          
          {/* Left Panel: Hero Graphics & Branding */}
          <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white position-relative" style={{
            background: 'var(--gradient-hero)',
            overflow: 'hidden'
          }}>
            {/* Vector grid pattern overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.1,
              backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              pointerEvents: 'none'
            }}></div>

            {/* Header branding */}
            <div className="text-start z-1">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="bg-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <img
                    src="https://devindia.in/assets/images/logo.png"
                    alt="Logo"
                    style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                  />
                </div>
                <div>
                  <h4 className="fw-bold mb-0 text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>TransitOps</h4>
                  <small className="opacity-75" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Operations Control</small>
                </div>
              </div>
            </div>

            {/* Middle welcome message */}
            <div className="text-start my-auto py-5 z-1">
              <h2 className="fw-bold mb-3 lh-base" style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', letterSpacing: '-0.5px' }}>
                Streamlining Fleet <br />
                & Dispatch Operations.
              </h2>
              <p className="opacity-80 mb-4" style={{ fontSize: '0.95rem', fontWeight: 300, lineHeight: 1.6 }}>
                Access live dispatch consoles, vehicle logs, security audit registries, and driver schedules in one unified portal.
              </p>

              {/* Bullet Features */}
              <div className="d-flex flex-column gap-3 mt-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <i className="fas fa-check text-white" style={{ fontSize: '12px' }}></i>
                  </div>
                  <span className="small fw-semibold">On-Time Dispatch Monitoring</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <i className="fas fa-check text-white" style={{ fontSize: '12px' }}></i>
                  </div>
                  <span className="small fw-semibold">Dynamic Operations Dashboard</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <i className="fas fa-check text-white" style={{ fontSize: '12px' }}></i>
                  </div>
                  <span className="small fw-semibold">Secure Role-Based Access Controls</span>
                </div>
              </div>
            </div>

            {/* Footer copyright */}
            <div className="text-start z-1 opacity-75 small">
              &copy; {new Date().getFullYear()} TransitOps Inc. All rights reserved.
            </div>
          </div>

          {/* Right Panel: Login Credentials Form */}
          <div className="col-lg-6 p-4 p-md-5 d-flex flex-column justify-content-center bg-card">
            
            {/* Header Title */}
            <div className="text-start mb-4">
              <div className="d-flex align-items-center gap-2 mb-3 d-lg-none">
                <img
                  src="https://devindia.in/assets/images/logo.png"
                  alt="Logo"
                  style={{ height: '36px', width: 'auto' }}
                />
                <h4 className="fw-bold mb-0 text-dark" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>TransitOps</h4>
              </div>
              
              <h3 className="fw-bold text-dark mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>Welcome Back</h3>
              <p className="text-muted small">Please sign in to access your administrative operations console.</p>
            </div>

            {/* Error Message banner */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-3 px-3 rounded-3 mb-4 text-start" role="alert" style={{ fontSize: '0.85rem' }}>
                <i className="fas fa-exclamation-circle fs-6"></i>
                <div>{error}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="text-start">
              
              {/* Login Role field */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">Login Role</label>
                <div className="input-group">
                  <span className="input-group-text border-end-0 bg-transparent text-muted" style={{ borderColor: 'var(--border-color)' }}>
                    <i className="fas fa-user-shield"></i>
                  </span>
                  <select
                    className="form-select border-start-0"
                    style={{ borderColor: 'var(--border-color)', height: '46px', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select Role --</option>
                    {roles.map((role) => (
                      <option key={role.roleID} value={role.roleID}>
                        {role.RoleName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email field */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text border-end-0 bg-transparent text-muted" style={{ borderColor: 'var(--border-color)' }}>
                    <i className="fas fa-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control border-start-0 ps-0"
                    style={{ borderColor: 'var(--border-color)', height: '46px', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
                    placeholder="name@transitops.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-semibold text-dark small mb-0">Password</label>
                  <a href="#" className="small text-decoration-none text-primary fw-semibold" style={{ fontSize: '0.75rem' }} onClick={(e) => {
                    e.preventDefault();
                    alert('Demo password is: admin123');
                  }}>Forgot Password?</a>
                </div>
                <div className="input-group">
                  <span className="input-group-text border-end-0 bg-transparent text-muted" style={{ borderColor: 'var(--border-color)' }}>
                    <i className="fas fa-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0 border-end-0 ps-0"
                    style={{ borderColor: 'var(--border-color)', height: '46px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-group-text bg-transparent text-muted"
                    style={{ borderColor: 'var(--border-color)', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Remember me option */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMeCheck"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="form-check-label text-muted small fw-semibold" htmlFor="rememberMeCheck" style={{ userSelect: 'none' }}>
                    Keep me signed in
                  </label>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                style={{
                  height: '48px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'var(--transition)'
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <i className="fas fa-sign-in-alt"></i>
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials Panel */}
            <div className="mt-4 p-3 rounded-3 text-start" style={{
              background: 'var(--card-muted-bg)',
              border: '1px dashed var(--border-color)',
              fontSize: '0.8rem'
            }}>
              <div className="d-flex align-items-center gap-2 text-primary fw-bold mb-1">
                <i className="fas fa-info-circle"></i>
                <span>Demo Admin Access Credentials</span>
              </div>
              <div className="text-muted">
                Use the following credentials to access the system:
                <div className="mt-2 font-monospace">
                  <strong>Email:</strong> admin@transitops.com <br />
                  <strong>Password:</strong> admin123
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
