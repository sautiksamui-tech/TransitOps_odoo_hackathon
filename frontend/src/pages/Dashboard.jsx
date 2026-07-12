import React, { useState } from 'react';

const CATEGORIES = [
  {
    title: 'User & Operator Management',
    icon: 'fas fa-users-cog',
    color: '#0B4DBB',
    items: [
      { label: 'Manage System Users', page: 'users', icon: 'fas fa-users' },
      { label: 'Create Operator Account', page: 'add-user', icon: 'fas fa-user-plus' },
    ]
  },
  {
    title: 'Driver Fleet Management',
    icon: 'fas fa-id-card',
    color: '#8B5CF6',
    items: [
      { label: 'Driver Directory', page: 'drivers', icon: 'fas fa-list' },
      { label: 'Add New Driver', page: 'add-driver', icon: 'fas fa-user-plus' },
    ]
  },
  {
    title: 'Vehicle Fleet Management',
    icon: 'fas fa-bus',
    color: '#FF7A00',
    items: [
      { label: 'Vehicle Directory', page: 'vehicle', icon: 'fas fa-list' },
      { label: 'Add New Vehicle', page: 'add-vehicle', icon: 'fas fa-plus-circle' },
    ]
  },
  {
    title: 'Dispatch & Operations',
    icon: 'fas fa-route',
    color: '#16A34A',
    items: [
      { label: 'Trip Log Reports', page: 'trips', icon: 'fas fa-file-invoice' },
      { label: 'Schedule New Trip', page: 'add-trip', icon: 'fas fa-shipping-fast' },
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

export default function Dashboard({ 
  onNavigate, 
  activityLog = [], 
  vehicles = [], 
  customers = [], 
  users = [], 
  trips = [],
  drivers = []
}) {
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

  // Compute stats in-memory from props
  const totalVehicles = vehicles.length;
  const totalDrivers = drivers.length;
  const totalCustomers = customers.length;
  const totalTrips = trips.length;

  // Process fuel types
  const petrolCount = vehicles.filter(v => (v.fuel_type || 'petrol').toLowerCase() === 'petrol').length;
  const dieselCount = vehicles.filter(v => (v.fuel_type || '').toLowerCase() === 'diesel').length;
  
  const totalFuelVehicles = petrolCount + dieselCount || 1;
  const petrolPct = Math.round((petrolCount / totalFuelVehicles) * 100);
  const dieselPct = Math.round((dieselCount / totalFuelVehicles) * 100);

  // Process vehicle status
  const availableVehicles = vehicles.filter(v => (v.status || 'available').toLowerCase() === 'available').length;
  const maintenanceVehicles = vehicles.filter(v => (v.status || '').toLowerCase() === 'maintenance').length;
  const outServiceVehicles = vehicles.filter(v => (v.status || '').toLowerCase() === 'out of service').length;

  // Process trip status
  const completedTripsCount = trips.filter(t => (t.status || '').toLowerCase() === 'completed').length;
  const pendingTripsCount = trips.filter(t => (t.status || 'pending').toLowerCase() === 'pending').length;
  const totalWeight = trips
    .filter(t => (t.status || '').toLowerCase() === 'completed')
    .reduce((sum, t) => sum + (t.cargo_weight || 0), 0);

  // Take the 5 most recent trips
  const recentTrips = [...trips].reverse().slice(0, 5);

  return (
    <div className="container-fluid py-3 text-start">
      {/* Welcome Banner */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="p-4 rounded-4 position-relative overflow-hidden text-white shadow-sm" style={{ background: 'var(--gradient-hero)' }}>
            <div className="row align-items-center">
              <div className="col-lg-8">
                <span className="badge bg-info bg-opacity-20 text-white mb-2 px-3 py-2 rounded-pill fw-semibold" style={{ backdropFilter: 'blur(4px)' }}>
                  <i className="fas fa-satellite-dish me-1"></i> Transit Operations Centre
                </span>
                <h2 className="fw-bold mb-1 text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
                  TransitOps Control
                </h2>
                <p className="mb-0 opacity-85 text-light small">
                  Logged in as <strong className="text-white">Administrator</strong> (Ops Admin)
                </p>
              </div>
              <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
                <div className="small opacity-85"><i className="fas fa-clock me-1"></i> System Time</div>
                <div className="fs-5 fw-bold text-white">{new Date().toDateString()}</div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="row align-items-center mt-3 pt-3 border-top border-white border-opacity-10">
              <div className="col-md-6 mb-2 mb-md-0">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
                    <i className="fas fa-shipping-fast text-white"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="d-flex justify-content-between align-items-baseline">
                      <span className="small fw-semibold opacity-90">Completed Dispatch Load</span>
                      <span className="fw-bold fs-6">{completedTripsCount} Trips</span>
                    </div>
                    <div className="progress mt-1 bg-white bg-opacity-20" style={{ height: '6px', borderRadius: '3px' }}>
                      <div className="progress-bar bg-white" role="progressbar" style={{ width: `${(completedTripsCount / (totalTrips || 1)) * 100}%`, borderRadius: '3px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
                    <i className="fas fa-weight-hanging text-white"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="d-flex justify-content-between align-items-baseline">
                      <span className="small fw-semibold opacity-90">Total Cargo Dispatched</span>
                      <span className="fw-bold fs-6">{totalWeight.toLocaleString()} kg</span>
                    </div>
                    <div className="progress mt-1 bg-white bg-opacity-20" style={{ height: '6px', borderRadius: '3px' }}>
                      <div className="progress-bar bg-white" role="progressbar" style={{ width: '100%', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Counters Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card stat-blue">
            <p className="mb-1 text-uppercase fw-semibold tracking-wider" style={{ fontSize: '.7rem' }}>Total Vehicles</p>
            <h3 className="mb-0 fw-bold">{totalVehicles}</h3>
            <i className="fas fa-bus stat-icon"></i>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card stat-purple">
            <p className="mb-1 text-uppercase fw-semibold tracking-wider" style={{ fontSize: '.7rem' }}>Total Drivers</p>
            <h3 className="mb-0 fw-bold">{totalDrivers}</h3>
            <i className="fas fa-id-card stat-icon"></i>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card stat-green">
            <p className="mb-1 text-uppercase fw-semibold tracking-wider" style={{ fontSize: '.7rem' }}>Total Customers</p>
            <h3 className="mb-0 fw-bold">{totalCustomers}</h3>
            <i className="fas fa-address-book stat-icon"></i>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card stat-orange">
            <p className="mb-1 text-uppercase fw-semibold tracking-wider" style={{ fontSize: '.7rem' }}>Trips Scheduled</p>
            <h3 className="mb-0 fw-bold">{totalTrips}</h3>
            <i className="fas fa-route stat-icon"></i>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Block */}
      <div className="row g-4 mb-4">
        {/* Left Column: Fuel & Status Graphs */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-dark)' }}>
              <i className="fas fa-chart-pie text-primary me-2"></i>Fleet Capacity & Fuel Mix
            </h5>
            
            {/* Split Fuel bar */}
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-2">
                <span className="small fw-semibold text-secondary">Fuel Type Mix</span>
                <span className="small text-muted">Petrol {petrolPct}% / Diesel {dieselPct}%</span>
              </div>
              <div className="progress rounded-pill" style={{ height: '24px', overflow: 'hidden' }}>
                <div 
                  className="progress-bar bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" 
                  style={{ width: `${petrolPct}%`, fontSize: '.75rem' }}
                >
                  {petrolPct > 15 && `Petrol (${petrolCount})`}
                </div>
                <div 
                  className="progress-bar bg-info text-white fw-bold d-flex align-items-center justify-content-center" 
                  style={{ width: `${dieselPct}%`, fontSize: '.75rem' }}
                >
                  {dieselPct > 15 && `Diesel (${dieselCount})`}
                </div>
              </div>
            </div>

            {/* Vehicle Status Progress */}
            <div className="row g-3 mt-2">
              <span className="small fw-semibold text-secondary mb-1">Fleet Vehicle Availability Status</span>
              
              <div className="col-4 text-center">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="text-success fw-bold fs-4">{availableVehicles}</div>
                  <small className="text-muted text-uppercase tracking-wider" style={{ fontSize: '.6rem' }}>Available</small>
                </div>
              </div>

              <div className="col-4 text-center">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="text-warning fw-bold fs-4">{maintenanceVehicles}</div>
                  <small className="text-muted text-uppercase tracking-wider" style={{ fontSize: '.6rem' }}>Maintenance</small>
                </div>
              </div>

              <div className="col-4 text-center">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="text-danger fw-bold fs-4">{outServiceVehicles}</div>
                  <small className="text-muted text-uppercase tracking-wider" style={{ fontSize: '.6rem' }}>Out of Service</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dispatch SVG Trends Line Chart */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-dark)' }}>
                  <i className="fas fa-chart-line text-success me-2"></i>Weekly Dispatch Trends
                </h5>
                <small className="text-muted">On-time metrics & success rate</small>
              </div>
            </div>

            <div className="d-flex flex-column justify-content-center align-items-center position-relative mt-2" style={{ minHeight: '170px' }}>
              <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-color)" strokeWidth="1" />

                <text x={padding - 5} y={padding + 4} textAnchor="end" fontSize="8" fill="var(--text-muted)">100%</text>
                <text x={padding - 5} y={height / 2 + 4} textAnchor="end" fontSize="8" fill="var(--text-muted)">50%</text>
                <text x={padding - 5} y={height - padding + 4} textAnchor="end" fontSize="8" fill="var(--text-muted)">0%</text>

                <path d={getAreaPath(pointsSuccess)} fill="rgba(11, 77, 187, 0.04)" />
                <path d={getAreaPath(pointsOnTime)} fill="rgba(255, 122, 0, 0.04)" />

                <path d={getLinePath(pointsSuccess)} fill="none" stroke="#0B4DBB" strokeWidth="2.5" />
                <path d={getLinePath(pointsOnTime)} fill="none" stroke="#FF7A00" strokeWidth="2.5" />

                {DISPATCH_TRENDS.map((t, idx) => {
                  const x = padding + (idx * (width - 2 * padding)) / (DISPATCH_TRENDS.length - 1);
                  return (
                    <text key={idx} x={x} y={height - padding + 14} textAnchor="middle" fontSize="8" fill="var(--text-muted)" fontWeight="500">
                      {t.day}
                    </text>
                  );
                })}

                {pointsSuccess.map((p, idx) => (
                  <circle
                    key={`suc-${idx}`}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint === `suc-${idx}` ? 5 : 3.5}
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
                    r={hoveredPoint === `ont-${idx}` ? 5 : 3.5}
                    fill="#FF7A00"
                    stroke="#fff"
                    strokeWidth="1.5"
                    onMouseEnter={() => setHoveredPoint(`ont-${idx}`)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  />
                ))}
              </svg>

              <div className="d-flex gap-3 justify-content-center mt-3 w-100">
                <div className="d-flex align-items-center gap-1">
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#0B4DBB', borderRadius: '2px' }}></span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>Dispatch Success</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#FF7A00', borderRadius: '2px' }}></span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>On-Time Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="border-start border-primary border-4 ps-3 mb-3 text-start">
        <h5 className="fw-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-dark)' }}>Quick Actions</h5>
        <p className="text-muted small mb-0">Launch shortcuts to manage core portal registers.</p>
      </div>
      <div className="row g-3 mb-4">
        {CATEGORIES.map((cat) => (
          <div className="col-12 col-md-6 col-lg-3" key={cat.title}>
            <div className="quick-action-card h-100 border rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="icon-box d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', borderRadius: '6px', background: `${cat.color}15`, color: cat.color }}>
                  <i className={`${cat.icon} fs-6`}></i>
                </div>
                <h6 className="fw-bold mb-0 text-truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-dark)', fontSize: '.85rem' }}>{cat.title}</h6>
              </div>
              <div className="d-flex flex-column gap-2">
                {cat.items.map((item) => (
                  <a
                    key={item.label}
                    onClick={() => onNavigate(item.page)}
                    className="quick-action-link d-flex align-items-center gap-2 p-2 rounded text-decoration-none"
                    style={{ transition: 'var(--transition)', cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center justify-content-center text-muted" style={{ width: '20px', height: '20px', fontSize: '0.8rem' }}>
                      <i className={item.icon}></i>
                    </div>
                    <span className="small fw-semibold text-truncate">{item.label}</span>
                    <i className="fas fa-chevron-right ms-auto text-muted small-chevron" style={{ fontSize: '0.65rem', opacity: 0.5 }}></i>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Log & Trips */}
      <div className="row g-4">
        {/* Recent Activity Log */}
        <div className="col-12 col-lg-6">
          <div className="border-start border-primary border-4 ps-3 mb-3">
            <h5 className="fw-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-dark)' }}>Portal Activity Log</h5>
            <p className="text-muted small mb-0 font-monospace">System auditing register</p>
          </div>
          <div className="card border-0 shadow-sm rounded-4 p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLog.slice(0, 5).map((log, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className={`badge ${log.action === 'INSERT' ? 'bg-success' : log.action === 'DELETE' ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize: '.65rem' }}>
                          {log.action}
                        </span>
                      </td>
                      <td className="small fw-semibold">{log.module}</td>
                      <td className="small text-muted">{log.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="col-12 col-lg-6">
          <div className="border-start border-primary border-4 ps-3 mb-3">
            <h5 className="fw-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-dark)' }}>Recent Dispatch Logs</h5>
            <p className="text-muted small mb-0">Latest routes and assigned shipments</p>
          </div>
          <div className="card border-0 shadow-sm rounded-4 p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Vehicle</th>
                    <th>Load</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.length > 0 ? (
                    recentTrips.map((rt) => (
                      <tr key={rt.ID}>
                        <td><strong className="text-primary">#{rt.ID}</strong></td>
                        <td className="small fw-semibold">{rt.plate_no || 'Unassigned'}</td>
                        <td className="small">{rt.cargo_weight ? `${rt.cargo_weight} kg` : '0 kg'}</td>
                        <td>
                          <span className={`badge ${rt.status === 'completed' ? 'bg-success' : 'bg-info text-dark'}`} style={{ fontSize: '.65rem' }}>
                            {rt.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-3 small">No recent trips dispatched.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
