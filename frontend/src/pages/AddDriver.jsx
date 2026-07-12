import React, { useState } from 'react';

export default function AddDriver({ onAddDriver, onCancel }) {
  const [name, setName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [status, setStatus] = useState('active');
  const [errors, setErrors] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = [];

    if (!name.trim()) errs.push('Driver Name is required.');
    if (!licenseNo.trim()) errs.push('License Number is required.');
    if (!phoneNo.trim()) errs.push('Phone Number is required.');

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    onAddDriver({
      name: name.trim(),
      license_no: licenseNo.trim(),
      phone_no: phoneNo.trim(),
      status: status
    });
  };

  return (
    <div className="container-fluid py-3 text-start">
      {/* Header */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <button onClick={onCancel} className="btn btn-sm btn-outline-secondary">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h5 className="mb-0 fw-bold">
            <i className="fas fa-user-plus me-2 text-primary"></i>Register New Driver
          </h5>
          <p className="text-muted small mb-0">Add driver licensing and contact profile details</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <i className="fas fa-exclamation-triangle me-2 text-danger"></i>
          <strong className="text-danger small">Validation Error:</strong>
          <ul className="mb-0 ps-3 mt-1 small">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
          <button type="button" className="btn-close" onClick={() => setErrors([])}></button>
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '16px' }}>
              <div className="row g-3">
                {/* Driver Name */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Driver Name <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fas fa-user text-muted"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Gurpreet Singh"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Phone Contact */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Phone Contact <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fas fa-phone text-muted"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +91 9876543210"
                      value={phoneNo}
                      onChange={(e) => setPhoneNo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* License Number */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">License Number <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fas fa-id-card text-muted"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. DL-1420110012345"
                      value={licenseNo}
                      onChange={(e) => setLicenseNo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Status</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fas fa-info-circle text-muted"></i></span>
                    <select
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="active">Active (Available)</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary px-4">
                  <i className="fas fa-save me-2"></i>Register Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
