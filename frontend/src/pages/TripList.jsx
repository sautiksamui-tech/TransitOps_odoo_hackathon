import React, { useState } from 'react';

export default function TripList({
  trips,
  onAddTripClick,
  onEditTripClick,
  onDeleteTrip,
  onCompleteTrip
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to format full address
  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    const parts = [
      addr.house_no,
      addr.area,
      addr.town,
      addr.state,
      addr.pincode
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Filtered trips
  const filteredTrips = trips.filter((t) => {
    const q = searchQuery.toLowerCase();
    const sourceStr = `${t.source_house || ''} ${t.source_area || ''} ${t.source_town || ''} ${t.source_state || ''}`.toLowerCase();
    const destStr = `${t.dest_house || ''} ${t.dest_area || ''} ${t.dest_town || ''} ${t.dest_state || ''}`.toLowerCase();
    const plateStr = (t.plate_no || '').toLowerCase();
    const driverStr = (t.driver_name || '').toLowerCase();
    return (
      sourceStr.includes(q) ||
      destStr.includes(q) ||
      plateStr.includes(q) ||
      driverStr.includes(q) ||
      (t.status && t.status.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'completed') return 'bg-success';
    return 'bg-info text-dark';
  };

  return (
    <div className="container-fluid py-3 text-start">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h5 className="mb-0 fw-bold">
            <i className="fas fa-route me-2 text-primary"></i>Transit Trips Dispatcher
          </h5>
          <p className="text-muted small mb-0 mt-1">Plan, dispatch, and track active delivery route assignments</p>
        </div>
        <button className="btn btn-primary" onClick={onAddTripClick}>
          <i className="fas fa-plus me-2"></i>Add Trip
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card stat-blue text-center py-3">
            <h4 className="mb-0">{trips.length}</h4>
            <p className="mb-0 small">Total Trips</p>
            <i className="fas fa-route stat-icon"></i>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card stat-orange text-center py-3">
            <h4 className="mb-0">
              {trips.filter(t => (t.status || 'pending').toLowerCase() === 'pending').length}
            </h4>
            <p className="mb-0 small">In Transit (Pending)</p>
            <i className="fas fa-shipping-fast stat-icon"></i>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card stat-green text-center py-3">
            <h4 className="mb-0">
              {trips.filter(t => (t.status || '').toLowerCase() === 'completed').length}
            </h4>
            <p className="mb-0 small">Completed Trips</p>
            <i className="fas fa-check-double stat-icon"></i>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card stat-purple text-center py-3">
            <h4 className="mb-0">
              {trips
                .filter(t => (t.status || '').toLowerCase() === 'completed')
                .reduce((acc, t) => acc + (t.cargo_weight || 0), 0)
                .toLocaleString()} kg
            </h4>
            <p className="mb-0 small">Delivered Payload</p>
            <i className="fas fa-weight-hanging stat-icon"></i>
          </div>
        </div>
      </div>

      {/* Trips Table Card */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent d-flex align-items-center justify-content-between flex-wrap gap-2 py-3">
          <span className="fw-semibold"><i className="fas fa-list me-2"></i>Trip Directory ({filteredTrips.length})</span>
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ maxWidth: '260px' }}
            placeholder="🔍 Search location, plate, driver, status..."
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
                  <th style={{ width: '22%' }}>Source / Origin Address</th>
                  <th style={{ width: '22%' }}>Destination Address</th>
                  <th style={{ width: '13%' }}>Vehicle</th>
                  <th style={{ width: '13%' }}>Assigned Driver</th>
                  <th style={{ width: '10%' }}>Cargo Weight</th>
                  <th style={{ width: '7%' }}>Status</th>
                  <th style={{ width: '8%' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-5">
                      <i className="fas fa-route fa-2x mb-2 d-block opacity-25"></i>
                      No trips scheduled in the dispatcher.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((t, idx) => (
                    <tr key={t.ID}>
                      <td className="text-muted">{idx + 1}</td>
                      <td>
                        <div className="small text-dark fw-semibold" title={formatAddress({
                          house_no: t.source_house,
                          area: t.source_area,
                          town: t.source_town,
                          state: t.source_state,
                          pincode: t.source_pincode
                        })}>
                          <i className="fas fa-map-marker-alt text-primary me-2"></i>
                          {t.source_town ? `${t.source_town}, ${t.source_state}` : 'Unknown Location'}
                        </div>
                        <span className="small text-muted d-block ps-4 text-truncate" style={{ maxWidth: '240px' }}>
                          {t.source_house ? `${t.source_house}, ${t.source_area}` : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div className="small text-dark fw-semibold" title={formatAddress({
                          house_no: t.dest_house,
                          area: t.dest_area,
                          town: t.dest_town,
                          state: t.dest_state,
                          pincode: t.dest_pincode
                        })}>
                          <i className="fas fa-flag-checkered text-success me-2"></i>
                          {t.dest_town ? `${t.dest_town}, ${t.dest_state}` : 'Unknown Location'}
                        </div>
                        <span className="small text-muted d-block ps-4 text-truncate" style={{ maxWidth: '240px' }}>
                          {t.dest_house ? `${t.dest_house}, ${t.dest_area}` : 'N/A'}
                        </span>
                      </td>
                      <td>
                        {t.plate_no ? (
                          <div className="d-flex flex-column">
                            <strong className="text-dark"><i className="fas fa-truck text-muted me-1 small"></i>{t.plate_no}</strong>
                            <span className="small text-muted" style={{ fontSize: '.7rem' }}>
                              Cap: {t.maxloadcapacity ? `${t.maxloadcapacity} kg` : 'N/A'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted small">Unassigned</span>
                        )}
                      </td>
                      <td>
                        {t.driver_name ? (
                          <div className="d-flex flex-column">
                            <strong className="text-dark"><i className="fas fa-user-tie text-muted me-1 small"></i>{t.driver_name}</strong>
                            <span className="small text-muted" style={{ fontSize: '.7rem' }}>
                              ID: #{t.DriverID}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted small">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {t.cargo_weight ? `${t.cargo_weight} kg` : '0 kg'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(t.status)}`}>
                          {t.status || 'pending'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end align-items-center">
                          {(t.status || 'pending').toLowerCase() === 'pending' && (
                            <button
                              className="btn btn-xs btn-success me-1"
                              onClick={() => onCompleteTrip(t.ID)}
                              title="Mark Completed"
                              style={{ fontSize: '.72rem', padding: '2px 6px' }}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-xs btn-outline-primary"
                            onClick={() => onEditTripClick(t)}
                            title="Edit Trip"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-xs btn-outline-danger"
                            onClick={() => onDeleteTrip(t.ID)}
                            title="Delete Trip"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
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
