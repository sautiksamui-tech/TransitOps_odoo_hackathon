import React, { useState } from 'react';

const CATEGORIES = [
  {
    title: 'User & Operator Management',
    icon: 'fas fa-users-cog',
    color: '#0B4DBB',
    items: [
      { label: 'Manage System Users', page: 'users', icon: 'fas fa-users' },
      { label: 'Create Operator Account', page: 'add-user', icon: 'fas fa-user-plus' },
      { label: 'Security Audit Log', page: 'school_activity', icon: 'fas fa-history' },
    ]
  },
  {
    title: 'Vehicle Fleet Management',
    icon: 'fas fa-bus',
    color: '#FF7A00',
    items: [
      { label: 'Vehicle Directory', page: 'vehicle', icon: 'fas fa-list' },
      { label: 'Add New Vehicle', page: 'vehicle-add', icon: 'fas fa-plus-circle' },
      { label: 'Route Scheduling', page: 'vehicle-routes', icon: 'fas fa-calendar-alt' },
      { label: 'Maintenance Records', page: 'vehicle-maintenance', icon: 'fas fa-tools' },
    ]
  },
  {
    title: 'Dispatch & Operations',
    icon: 'fas fa-route',
    color: '#16A34A',
    items: [
      { label: 'Live Dispatch Console', page: 'dispatch-live', icon: 'fas fa-headset' },
      { label: 'Trip Log Reports', page: 'trips', icon: 'fas fa-file-invoice' },
      { label: 'Fuel Log Registry', page: 'fuel', icon: 'fas fa-gas-pump' },
    ]
  }
];

const DISPATCH_TRENDS = [
  { day: 'Mon', success: 92, onTime: 95 },
  { day: 'Tue', success: 94, onTime: 90 },
  { day: 'Wed', success: 89, onTime: 100 },
  { day: 'Thu', success: 95, onTime: 95 },
  { day: 'Fri', success: 93, onTime: 90 },
  { day: 'Sat', success: 96, onTime: 95 },
  { day: 'Sun', success: 94, onTime: 90 },
];

export default function Dashboard({ stats, onNavigate, activityLog }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // SVG dimensions for custom chart
  const width = 360;
  const height = 150;
  const padding = 25;

  const pointsSuccess = DISPATCH_TRENDS.map((t, idx) => {
    const x = padding + (idx * (width - 2 * padding)) / (DISPATCH_TRENDS.length - 1);
    const y = height - padding - (t.success / 100) * (height - 2 * padding);
    return { x, y, val: t.success, label: t.day };
  });

  const pointsOnTime = DISPATCH_TRENDS.map((t, idx) => {
    const x = padding + (idx * (width - 2 * padding)) / (DISPATCH_TRENDS.length - 1);
    const y = height - padding - (t.onTime / 100) * (height - 2 * padding);
    return { x, y, val: t.onTime, label: t.day };
  });

  const getLinePath = (pts) => {
    return pts.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  };

  const getAreaPath = (pts) => {
    if (pts.length === 0) return '';
    const first = pts[0];
    const last = pts[pts.length - 1];
    const line = getLinePath(pts);
    return `${line} L ${last.x} ${height - padding} L ${first.x} ${height - padding} Z`;
  };

  return (
    <div className="container-fluid py-3">
      {/* Welcome Banner */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="p-4 rounded-4 position-relative overflow-hidden text-white shadow-sm" style={{ background: 'var(--gradient-hero)' }}>
            <div className="row align-items-center">
              <div className="col-lg-8 text-start">
                <span className="badge bg-info bg-opacity-20 text-white mb-2 px-3 py-2 rounded-pill fw-semibold" style={{ backdropFilter: 'blur(4px)' }}>
                  <i className="fas fa-satellite-dish me-1"></i> Transit Operations Centre
                </span>
                <h2 className="fw-bold mb-1 text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
                  TransitOps Portal
                </h2>
                <p className="mb-0 opacity-85 text-light small">
                  Logged in as <strong className="text-white">Administrator</strong> (Ops Admin)
                </p>
              </div>
              <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
                <div className="small opacity-85"><i className="fas fa-clock me-1"></i> Operations Time</div>
                <div className="fs-5 fw-bold">{new Date().toDateString()}</div>
              </div>
            </div>

            {/* Dispatch & Operator Metrics Row */}
            <div className="row align-items-center mt-3 pt-3 border-top border-white border-opacity-10 text-start">
              <div className="col-md-6 mb-2 mb-md-0">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
                    <i className="fas fa-route fs-5 text-white"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="d-flex justify-content-between align-items-baseline">
                      <span className="small fw-semibold opacity-90">Today's Dispatched Trips</span>
                      <span className="fw-bold fs-6">14 / 15 <span className="small opacity-80">(93%)</span></span>
                    </div>
                    <div className="progress mt-1 bg-white bg-opacity-20" style={{ height: '6px', borderRadius: '3px' }}>
                      <div className="progress-bar bg-white" role="progressbar" style={{ width: '93%', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
                    <i className="fas fa-user-clock fs-5 text-white"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="d-flex justify-content-between align-items-baseline">
                      <span className="small fw-semibold opacity-90">Driver On-Time Rate</span>
                      <span className="fw-bold fs-6">18 / 20 <span className="small opacity-80">(90%)</span></span>
                    </div>
                    <div className="progress mt-1 bg-white bg-opacity-20" style={{ height: '6px', borderRadius: '3px' }}>
                      <div className="progress-bar bg-white" role="progressbar" style={{ width: '90%', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Header */}
      <div className="border-start border-primary border-4 ps-3 mb-4 text-start">
        <h4 className="fw-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-dark)' }}>Quick Actions</h4>
        <p className="text-muted small mb-0">Direct shortcuts to managing fleet operations and user accounts.</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="row g-3">
        {CATEGORIES.map((cat) => (
          <div className="col-12 col-md-6 col-lg-4" key={cat.title}>
            <div className="quick-action-card h-100">
              <div className="card-header border-0 d-flex align-items-center gap-2" style={{ background: 'transparent', padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
                <div className="icon-box d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${cat.color}15`, color: cat.color }}>
                  <i className={`${cat.icon} fs-5`}></i>
                </div>
                <h5 className="fw-bold mb-0 text-start" style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-dark)' }}>{cat.title}</h5>
              </div>
              <div className="card-body" style={{ padding: '0.5rem 1.25rem 1.25rem 1.25rem' }}>
                <div className="d-flex flex-column gap-2">
                  {cat.items.map((item) => (
                    <a
                      key={item.label}
                      onClick={() => onNavigate(item.page)}
                      className="quick-action-link d-flex align-items-center gap-2 p-2 rounded text-decoration-none"
                      style={{ transition: 'var(--transition)', cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center justify-content-center text-muted" style={{ width: '24px', height: '24px', fontSize: '0.85rem' }}>
                        <i className={item.icon}></i>
                      </div>
                      <span className="small fw-semibold">{item.label}</span>
                      <i className="fas fa-chevron-right ms-auto text-muted small-chevron" style={{ fontSize: '0.7rem', opacity: 0.5, transition: 'var(--transition)' }}></i>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overview & Summary + Attendance Chart */}
      <div className="row g-4 mt-4">
        {/* Left: Overview & Summary Cards */}
        <div className="col-12 col-xl-8 text-start">
          <div className="border-start border-primary border-4 ps-3 mb-4">
            <h4 className="fw-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-dark)' }}>Overview & Summary</h4>
            <p className="text-muted small mb-0">Key insights and performance indexes across active fleet modules.</p>
          </div>
          
          <div className="row g-3">
            <div className="col-6 col-md-4">
              <div className="stat-card stat-blue h-100">
                <p>Vehicles</p>
                <h3>{stats.vehicles}</h3>
                <i className="fas fa-bus stat-icon"></i>
              </div>
            </div>
            <div className="col-6 col-md-4">
              <div className="stat-card stat-purple h-100">
                <p>Active Routes</p>
                <h3>{stats.activeRoutes}</h3>
                <i className="fas fa-route stat-icon"></i>
              </div>
            </div>
            <div className="col-6 col-md-4">
              <div className="stat-card stat-green h-100">
                <p>Operators</p>
                <h3>{stats.operators}</h3>
                <i className="fas fa-users stat-icon"></i>
              </div>
            </div>
            <div className="col-6 col-md-4">
              <div className="stat-card stat-orange h-100">
                <p>Active Trips</p>
                <h3>{stats.activeTrips}</h3>
                <i className="fas fa-shipping-fast stat-icon"></i>
              </div>
            </div>
            <div className="col-6 col-md-4">
              <div className="stat-card h-100" style={{ borderLeft: '4px solid #06B6D4', background: 'var(--card-bg)' }}>
                <p style={{ color: '#06B6D4' }}>Maintenance Jobs</p>
                <h3 style={{ color: '#06B6D4' }}>{stats.maintenanceJobs}</h3>
                <i className="fas fa-tools stat-icon" style={{ color: '#06B6D4' }}></i>
              </div>
            </div>
            <div className="col-6 col-md-4">
              <div className="stat-card h-100" style={{ borderLeft: '4px solid #8B5CF6', background: 'var(--card-bg)' }}>
                <p style={{ color: '#8B5CF6' }}>Completed Trips</p>
                <h3 style={{ color: '#8B5CF6' }}>{stats.completedTrips}</h3>
                <i className="fas fa-check-double stat-icon" style={{ color: '#8B5CF6' }}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Custom Interactive Dispatch Trends Chart */}
        <div className="col-12 col-xl-4 text-start">
          <div className="card h-100 border-0 shadow-sm rounded-4">
            <div className="card-header bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-0" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-dark)' }}>Dispatch Trends</h5>
                <small className="text-muted">Trip statistics over the last 7 active days</small>
              </div>
            </div>
            <div className="card-body px-4 pb-4 d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '220px', position: 'relative' }}>
              <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-color)" strokeWidth="1" />

                {/* Y Axis helper labels */}
                <text x={padding - 5} y={padding + 4} textAnchor="end" fontSize="8" fill="var(--text-muted)">100%</text>
                <text x={padding - 5} y={height / 2 + 4} textAnchor="end" fontSize="8" fill="var(--text-muted)">50%</text>
                <text x={padding - 5} y={height - padding + 4} textAnchor="end" fontSize="8" fill="var(--text-muted)">0%</text>

                {/* Area charts */}
                <path d={getAreaPath(pointsSuccess)} fill="rgba(11, 77, 187, 0.04)" />
                <path d={getAreaPath(pointsOnTime)} fill="rgba(255, 122, 0, 0.04)" />

                {/* Lines */}
                <path d={getLinePath(pointsSuccess)} fill="none" stroke="#0B4DBB" strokeWidth="2.5" />
                <path d={getLinePath(pointsOnTime)} fill="none" stroke="#FF7A00" strokeWidth="2.5" />

                {/* X labels */}
                {DISPATCH_TRENDS.map((t, idx) => {
                  const x = padding + (idx * (width - 2 * padding)) / (DISPATCH_TRENDS.length - 1);
                  return (
                    <text key={idx} x={x} y={height - padding + 15} textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontWeight="500">
                      {t.day}
                    </text>
                  );
                })}

                {/* Interactive dots */}
                {pointsSuccess.map((p, idx) => (
                  <circle
                    key={`suc-${idx}`}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint === `suc-${idx}` ? 6 : 4}
                    fill="#0B4DBB"
                    stroke="#fff"
                    strokeWidth="1.5"
                    onMouseEnter={() => setHoveredPoint(`suc-${idx}`)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  />
                ))}

                {pointsOnTime.map((p, idx) => (
                  <circle
                    key={`ont-${idx}`}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint === `ont-${idx}` ? 6 : 4}
                    fill="#FF7A00"
                    stroke="#fff"
                    strokeWidth="1.5"
                    onMouseEnter={() => setHoveredPoint(`ont-${idx}`)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  />
                ))}
              </svg>

              {/* Legends */}
              <div className="d-flex gap-3 justify-content-center mt-3 w-100">
                <div className="d-flex align-items-center gap-1">
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#0B4DBB', borderRadius: '3px' }}></span>
                  <span className="small fw-semibold" style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>Dispatch Success %</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#FF7A00', borderRadius: '3px' }}></span>
                  <span className="small fw-semibold" style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>On-Time Rate %</span>
                </div>
              </div>

              {/* Custom Tooltip bubble */}
              {hoveredPoint && (() => {
                const [type, idxStr] = hoveredPoint.split('-');
                const idx = parseInt(idxStr);
                const pt = type === 'suc' ? pointsSuccess[idx] : pointsOnTime[idx];
                return (
                  <div
                    style={{
                      position: 'absolute',
                      top: pt.y - 45,
                      left: `${(pt.x / width) * 100}%`,
                      transform: 'translateX(-50%)',
                      background: 'var(--sidebar-title)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      boxShadow: 'var(--shadow)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      zIndex: 10
                    }}
                  >
                    {type === 'suc' ? 'Dispatch Success' : 'On-Time Rate'}: {pt.val}%
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs Panel */}
      <div className="border-start border-primary border-4 ps-3 mb-4 mt-4 text-start">
        <h4 className="fw-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-dark)' }}>Recent Actions Activity Log</h4>
        <p className="text-muted small mb-0 font-monospace">Real-time listing of audit log entries.</p>
      </div>
      <div className="card border-0 shadow-sm mb-4 text-start">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '15%' }}>Action</th>
                  <th style={{ width: '20%' }}>Module / Entity</th>
                  <th style={{ width: '45%' }}>Title Description</th>
                  <th style={{ width: '20%' }} className="text-end">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {activityLog.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">No recent activity logs found.</td>
                  </tr>
                ) : (
                  activityLog.map((log, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className={`badge ${log.action === 'INSERT' ? 'bg-success' : log.action === 'DELETE' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="small fw-semibold">{log.module} / {log.entity_type}</td>
                      <td>{log.title}</td>
                      <td className="text-end small text-muted font-monospace">{log.timestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
