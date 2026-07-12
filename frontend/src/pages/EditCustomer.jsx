import React, { useState, useEffect } from 'react';

export default function EditCustomer({ customer, onEditCustomer, onCancel }) {
  const [name, setName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [email, setEmail] = useState('');
  const [addresses, setAddresses] = useState([
    { house_no: '', area: '', pincode: '', town: '', state: '' }
  ]);
  const [errors, setErrors] = useState([]);

  // Prepopulate form
  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setMobileNo(customer.mobile_no || '');
      setEmail(customer.email || '');
      if (customer.addresses && customer.addresses.length > 0) {
        setAddresses(customer.addresses.map(a => ({
          house_no: a.house_no || '',
          area: a.area || '',
          pincode: a.pincode || '',
          town: a.town || '',
          state: a.state || ''
        })));
      } else {
        setAddresses([{ house_no: '', area: '', pincode: '', town: '', state: '' }]);
      }
    }
  }, [customer]);

  const handleAddressChange = (index, field, value) => {
    const updated = [...addresses];
    updated[index][field] = value;
    setAddresses(updated);
  };

  const addAddressField = () => {
    setAddresses([
      ...addresses,
      { house_no: '', area: '', pincode: '', town: '', state: '' }
    ]);
  };

  const removeAddressField = (index) => {
    if (addresses.length === 1) return;
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = [];

    if (!name.trim()) errs.push('Customer Name is required.');
    if (!mobileNo.trim()) errs.push('Mobile Number is required.');
    
    addresses.forEach((addr, idx) => {
      if (!addr.house_no.trim() || !addr.town.trim() || !addr.state.trim()) {
        errs.push(`Address #${idx + 1} must have House No, Town, and State.`);
      }
    });

    if (errs.length > 0) {
      setErrors(errs);
      window.scrollTo(0, 0);
      return;
    }

    onEditCustomer({
      CustomerID: customer.CustomerID,
      name,
      mobile_no: mobileNo,
      email: email || null,
      addresses
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
            <i className="fas fa-user-edit me-2 text-primary"></i>Edit Customer Profile
          </h5>
          <p className="text-muted small mb-0">Update contact info and delivery/transit addresses</p>
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

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="row g-4">
          {/* Customer profile card */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '16px' }}>
              <h6 className="fw-semibold text-muted text-uppercase mb-3" style={{ fontSize: '.7rem', letterSpacing: '.1em' }}>
                <i className="fas fa-id-card me-1"></i> Customer Profile
              </h6>

              <div className="mb-3">
                <label className="form-label fw-semibold">Customer Name <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-user text-muted"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Mobile Number <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-phone text-muted"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter mobile number"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Email Address <span className="text-muted">(Optional)</span></label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-envelope text-muted"></i></span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="customer@transitops.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Addresses card */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: '16px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold text-muted text-uppercase mb-0" style={{ fontSize: '.7rem', letterSpacing: '.1em' }}>
                  <i className="fas fa-map-marked-alt me-1"></i> Customer Addresses
                </h6>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-primary"
                  onClick={addAddressField}
                >
                  <i className="fas fa-plus me-1"></i> Add Address
                </button>
              </div>

              {addresses.map((addr, index) => (
                <div
                  key={index}
                  className="p-3 mb-3 border rounded-3 bg-light position-relative"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-secondary">Address #{index + 1}</span>
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => removeAddressField(index)}
                      >
                        <i className="fas fa-trash-alt me-1"></i>Remove
                      </button>
                    )}
                  </div>

                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="small fw-semibold mb-1">House/Flat No <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. 101/A"
                        value={addr.house_no}
                        onChange={(e) => handleAddressChange(index, 'house_no', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-8">
                      <label className="small fw-semibold mb-1">Area / Street</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Sector-4, Green Meadows"
                        value={addr.area}
                        onChange={(e) => handleAddressChange(index, 'area', e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="small fw-semibold mb-1">Pincode</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. 302001"
                        value={addr.pincode}
                        onChange={(e) => handleAddressChange(index, 'pincode', e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="small fw-semibold mb-1">Town / City <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Jaipur"
                        value={addr.town}
                        onChange={(e) => handleAddressChange(index, 'town', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="small fw-semibold mb-1">State <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Rajasthan"
                        value={addr.state}
                        onChange={(e) => handleAddressChange(index, 'state', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-4">
                <i className="fas fa-save me-2"></i>Save Changes
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
