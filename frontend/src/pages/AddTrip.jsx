import React, { useState } from 'react';

export default function AddTrip({ vehicles, customers, drivers = [], onAddTrip, onCancel }) {
  const [sourceID, setSourceID] = useState('');
  const [destID, setDestID] = useState('');
  const [vehicleID, setVehicleID] = useState('');
  const [driverID, setDriverID] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [errors, setErrors] = useState([]);

  // Flatten addresses from customer data
  const allAddresses = customers.flatMap((c) =>
    (c.addresses || []).map((addr) => ({
      id: addr.ID,
      label: `${c.name} - ${addr.house_no ? addr.house_no + ', ' : ''}${addr.area ? addr.area + ', ' : ''}${addr.town}, ${addr.state} (${addr.pincode})`
    }))
  );

  // Filter for available (active) drivers
  const availableDrivers = drivers.filter(
    (d) => (d.status || 'active').toLowerCase() === 'active'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = [];

    if (!sourceID) errs.push('Please select a Source Address.');
    if (!destID) errs.push('Please select a Destination Address.');
    if (sourceID && destID && sourceID === destID) {
      errs.push('Source and Destination addresses cannot be the same.');
    }
    if (!cargoWeight || isNaN(cargoWeight) || parseFloat(cargoWeight) <= 0) {
      errs.push('Cargo Weight must be a valid number greater than 0.');
    }

    // Vehicle capacity validation
    if (vehicleID) {
      const selectedVehicle = vehicles.find(v => v.VehicleID === parseInt(vehicleID, 10));
      if (selectedVehicle) {
        const capacity = selectedVehicle.maxloadcapacity;
        if (capacity && parseFloat(cargoWeight) > parseFloat(capacity)) {
          errs.push(
            `Capacity Exceeded! The cargo weight (${cargoWeight} kg) exceeds the maximum load capacity (${capacity} kg) of the selected vehicle (${selectedVehicle.plate_no}).`
          );
        }
      }
    }

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    onAddTrip({
      source_ID: parseInt(sourceID, 10),
      dest_ID: parseInt(destID, 10),
      VehicleID: vehicleID ? parseInt(vehicleID, 10) : null,
      DriverID: driverID ? parseInt(driverID, 10) : null,
      cargo_weight: parseFloat(cargoWeight),
      status: 'pending'
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
            <i className="fas fa-plus-circle me-2 text-primary"></i>Schedule New Trip
          </h5>
          <p className="text-muted small mb-0">Dispatch a new shipment cargo with weight and capacity checks</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <i className="fas fa-exclamation-triangle me-2 text-danger"></i>
          <strong className="text-danger small">Validation Checklist:</strong>
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
                
                {/* Source Address */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Origin / Source Address <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fas fa-map-marker-alt text-muted"></i></span>
                    <select
                      className="form-select"
                      value={sourceID}
                      onChange={(e) => setSourceID(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Origin Address --</option>
                      {allAddresses.map(addr => (
                        <option key={`src-${addr.id}`} value={addr.id}>{addr.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Destination Address */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Destination Address <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fas fa-flag-checkered text-muted"></i></span>
                    <select
                      className="form-select"
                      value={destID}
                      onChange={(e) => setDestID(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Destination Address --</option>
                      {allAddresses.map(addr => (
                        <option key={`dest-${addr.id}`} value={addr.id}>{addr.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Assigned Vehicle */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Assigned Fleet Vehicle</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fas fa-truck text-muted"></i></span>
                    <select
                      className="form-select"
                      value={vehicleID}
                      onChange={(e) => setVehicleID(e.target.value)}
                    >
                      <option value="">-- Unassigned --</option>
                      {vehicles.map(v => (
                        <option key={v.VehicleID} value={v.VehicleID}>
                          {v.plate_no} - {v.vehicle_type || 'Unknown'} ({v.maxloadcapacity ? `${v.maxloadcapacity} kg` : 'no cap limit'}) [{v.status || 'available'}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="small text-muted ps-1" style={{ fontSize: '.7rem' }}>
                    Select a vehicle with sufficient payload capacity.
                  </span>
                </div>

                {/* Assigned Driver */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Assigned Available Driver</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fas fa-id-card text-muted"></i></span>
                    <select
                      className="form-select"
                      value={driverID}
                      onChange={(e) => setDriverID(e.target.value)}
                    >
                      <option value="">-- Unassigned --</option>
                      {availableDrivers.map(d => (
                        <option key={d.DriverID} value={d.DriverID}>
                          {d.name} ({d.license_no})
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="small text-muted ps-1" style={{ fontSize: '.7rem' }}>
                    Only active/available drivers are listed.
                  </span>
                </div>

                {/* Cargo Weight */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Cargo Load Weight (kg) <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="fas fa-weight-hanging text-muted"></i></span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="e.g. 2450.50"
                      value={cargoWeight}
                      onChange={(e) => setCargoWeight(e.target.value)}
                      required
                    />
                  </div>
                </div>

              </div>

              <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary px-4">
                  <i className="fas fa-save me-2"></i>Schedule & Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
