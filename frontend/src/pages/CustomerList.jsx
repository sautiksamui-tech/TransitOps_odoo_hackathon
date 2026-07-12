import React, { useState } from 'react';

export default function CustomerList({
  customers,
  onDeleteCustomer,
  onAddCustomerClick,
  onEditCustomerClick
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered customers
  const filteredCustomers = customers.filter((cust) => {
    const q = searchQuery.toLowerCase();
    const matchesProfile =
      cust.name.toLowerCase().includes(q) ||
      cust.mobile_no.includes(q) ||
      (cust.email && cust.email.toLowerCase().includes(q));
    
    const matchesAddress = cust.addresses?.some(addr => 
      addr.town.toLowerCase().includes(q) || 
      addr.state.toLowerCase().includes(q) ||
      (addr.area && addr.area.toLowerCase().includes(q)) ||
      addr.pincode.includes(q)
    );

    return matchesProfile || matchesAddress;
  });

  return (
    <div className="container-fluid py-3 text-start">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h5 className="mb-0 fw-bold">
            <i className="fas fa-address-book me-2 text-primary"></i>Customer Directory
          </h5>
          <p className="text-muted small mb-0 mt-1">Manage corporate transit customers and delivery locations</p>
        </div>
        <button className="btn btn-primary" onClick={onAddCustomerClick}>
          <i className="fas fa-plus me-2"></i>Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <div className="stat-card stat-blue text-center py-3">
            <h4 className="mb-0">{customers.length}</h4>
            <p className="mb-0 small">Total Customers</p>
            <i className="fas fa-address-card stat-icon"></i>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="stat-card stat-green text-center py-3">
            <h4 className="mb-0">
              {customers.reduce((acc, c) => acc + (c.addresses ? c.addresses.length : 0), 0)}
            </h4>
            <p className="mb-0 small">Registered Locations</p>
            <i className="fas fa-map-marked-alt stat-icon"></i>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="stat-card stat-purple text-center py-3">
            <h4 className="mb-0">
              {customers.filter(c => c.addresses && c.addresses.length > 1).length}
            </h4>
            <p className="mb-0 small">Multi-Address Customers</p>
            <i className="fas fa-route stat-icon"></i>
          </div>
        </div>
      </div>

      {/* Customers Table Card */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent d-flex align-items-center justify-content-between flex-wrap gap-2 py-3">
          <span className="fw-semibold"><i className="fas fa-list me-2"></i>Customer Directory ({filteredCustomers.length})</span>
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ maxWidth: '260px' }}
            placeholder="🔍 Search name, mobile, state..."
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
                  <th style={{ width: '25%' }}>Customer Profile</th>
                  <th style={{ width: '20%' }}>Mobile Number</th>
                  <th style={{ width: '40%' }}>Registered Addresses</th>
                  <th style={{ width: '10%' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-5">
                      <i className="fas fa-address-book fa-2x mb-2 d-block opacity-25"></i>
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c, idx) => {
                    return (
                      <tr key={c.CustomerID}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{
                                width: '36px',
                                height: '36px',
                                background: 'linear-gradient(135deg,#0d6efd,#198754)',
                              }}
                            >
                              <span className="text-white fw-bold small">{c.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <strong className="text-dark d-block">{c.name}</strong>
                              {c.email && <span className="text-muted small">{c.email}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-semibold text-secondary">
                            <i className="fas fa-phone-alt me-2 small"></i>{c.mobile_no}
                          </span>
                        </td>
                        <td>
                          {c.addresses && c.addresses.length > 0 ? (
                            <div className="d-flex flex-column gap-2">
                              {c.addresses.map((addr, aIdx) => (
                                <div key={addr.ID || aIdx} className="small text-muted py-1 border-bottom-dashed">
                                  <i className="fas fa-map-marker-alt text-primary me-2"></i>
                                  <strong>{addr.house_no}</strong>, {addr.area ? addr.area + ',' : ''} {addr.town}, {addr.state} - <span className="fw-bold">{addr.pincode}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted small italic">No addresses registered.</span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end align-items-center">
                            <button
                              className="btn btn-xs btn-outline-primary"
                              onClick={() => onEditCustomerClick(c)}
                              title="Edit Customer Info"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-xs btn-outline-danger"
                              onClick={() => onDeleteCustomer(c.CustomerID)}
                              title="Delete Customer Profile"
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
