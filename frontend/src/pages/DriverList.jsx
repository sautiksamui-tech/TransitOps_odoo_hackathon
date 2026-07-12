import React, { useState } from 'react';

export default function DriverList({
  drivers,
  onDeleteDriver,
  onAddDriverClick,
  onEditDriverClick,
  onAddDocument,
  onDeleteDocument
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [docModalDriver, setDocModalDriver] = useState(null);
  const [docName, setDocName] = useState('');
  const [docPath, setDocPath] = useState('');

  // Filtered drivers
  const filteredDrivers = drivers.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      (d.name || '').toLowerCase().includes(q) ||
      (d.license_no || '').toLowerCase().includes(q) ||
      (d.phone_no || '').toLowerCase().includes(q) ||
      (d.status || '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    const s = (status || 'active').toLowerCase();
    if (s === 'active') return 'bg-success';
    if (s === 'suspended') return 'bg-warning text-dark';
    return 'bg-danger';
  };

  const handleOpenDocModal = (driver) => {
    setDocModalDriver(driver);
    setDocName('');
    setDocPath('');
  };

  const handleCloseDocModal = () => {
    setDocModalDriver(null);
  };

  const handleSaveDoc = (e) => {
    e.preventDefault();
    if (!docName || !docPath) return;
    onAddDocument(docModalDriver.DriverID, docName, docPath);
    handleCloseDocModal();
  };

  return (
    <div className="container-fluid py-3 text-start">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h5 className="mb-0 fw-bold">
            <i className="fas fa-id-card me-2 text-primary"></i>Driver Fleet Registry
          </h5>
          <p className="text-muted small mb-0 mt-1">Manage driver details, licensing, and compliance documentation</p>
        </div>
        <button className="btn btn-primary" onClick={onAddDriverClick}>
          <i className="fas fa-user-plus me-2"></i>Add Driver
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card stat-blue text-center py-3">
            <h4 className="mb-0">{drivers.length}</h4>
            <p className="mb-0 small">Total Drivers</p>
            <i className="fas fa-id-card stat-icon"></i>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card stat-green text-center py-3">
            <h4 className="mb-0">
              {drivers.filter(d => (d.status || 'active').toLowerCase() === 'active').length}
            </h4>
            <p className="mb-0 small">Active Drivers</p>
            <i className="fas fa-check-circle stat-icon"></i>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card stat-orange text-center py-3">
            <h4 className="mb-0">
              {drivers.filter(d => (d.status || '').toLowerCase() === 'suspended').length}
            </h4>
            <p className="mb-0 small">Suspended</p>
            <i className="fas fa-exclamation-triangle stat-icon"></i>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card stat-purple text-center py-3">
            <h4 className="mb-0">
              {drivers.reduce((acc, d) => acc + (d.documents ? d.documents.length : 0), 0)}
            </h4>
            <p className="mb-0 small">Compliance Documents</p>
            <i className="fas fa-folder-open stat-icon"></i>
          </div>
        </div>
      </div>

      {/* Drivers List Card */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent d-flex align-items-center justify-content-between flex-wrap gap-2 py-3">
          <span className="fw-semibold"><i className="fas fa-list me-2"></i>Drivers Directory ({filteredDrivers.length})</span>
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ maxWidth: '260px' }}
            placeholder="🔍 Search name, license, phone..."
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
                  <th style={{ width: '25%' }}>Driver Name</th>
                  <th style={{ width: '20%' }}>License Number</th>
                  <th style={{ width: '15%' }}>Phone Contact</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '15%' }}>Documents</th>
                  <th style={{ width: '10%' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-5">
                      <i className="fas fa-id-card fa-2x mb-2 d-block opacity-25"></i>
                      No drivers registered in the registry.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((d, idx) => (
                    <tr key={d.DriverID}>
                      <td className="text-muted">{idx + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px' }}>
                            {d.name ? d.name.charAt(0).toUpperCase() : 'D'}
                          </div>
                          <div>
                            <strong className="text-dark d-block">{d.name}</strong>
                            <span className="text-muted small" style={{ fontSize: '.7rem' }}>ID: #{d.DriverID}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="text-dark small fw-semibold">{d.license_no}</code>
                      </td>
                      <td>
                        <span className="small text-muted">{d.phone_no || 'N/A'}</span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(d.status)}`}>
                          {d.status || 'active'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          {d.documents && d.documents.map((doc) => (
                            <div key={doc.ID} className="d-flex justify-content-between align-items-center gap-2 border-bottom-dashed pb-1 small">
                              <span className="text-muted text-truncate" style={{ maxWidth: '120px' }} title={doc.DocumentName}>
                                <i className="fas fa-file-pdf text-danger me-1"></i>{doc.DocumentName}
                              </span>
                              <div className="d-flex gap-1">
                                <a
                                  href={doc.filepath}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-secondary hover-primary"
                                  title="View Document"
                                >
                                  <i className="fas fa-external-link-alt" style={{ fontSize: '.7rem' }}></i>
                                </a>
                                <button
                                  type="button"
                                  className="btn p-0 text-danger"
                                  style={{ fontSize: '.75rem' }}
                                  onClick={() => {
                                    if (window.confirm(`Delete document "${doc.DocumentName}"?`)) {
                                      onDeleteDocument(doc.ID);
                                    }
                                  }}
                                  title="Delete Document"
                                >
                                  <i className="fas fa-times-circle"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-secondary mt-1 align-self-start"
                            onClick={() => handleOpenDocModal(d)}
                            style={{ fontSize: '.65rem', padding: '1px 5px' }}
                          >
                            <i className="fas fa-plus-circle me-1"></i>Link Document
                          </button>
                        </div>
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <button
                            className="btn btn-xs btn-outline-primary"
                            onClick={() => onEditDriverClick(d)}
                            title="Edit Driver"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-xs btn-outline-danger"
                            onClick={() => onDeleteDriver(d.DriverID)}
                            title="Delete Driver"
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

      {/* Link Document Modal overlay */}
      {docModalDriver && (
        <div className="modal-backdrop-blur d-flex align-items-center justify-content-center">
          <div className="card shadow-lg border-0 p-4 text-start" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px' }}>
            <h5 className="fw-bold mb-1">Link Compliance Document</h5>
            <p className="text-muted small mb-3">Attach a PDF license copy or certificate for <strong>{docModalDriver.name}</strong></p>
            <form onSubmit={handleSaveDoc}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Document Description</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. License Back Side"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Document Path / URL</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. /uploads/docs/license_1.pdf"
                  value={docPath}
                  onChange={(e) => setDocPath(e.target.value)}
                  required
                />
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCloseDocModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Attach Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
