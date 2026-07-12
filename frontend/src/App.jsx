import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import Dashboard from './pages/Dashboard';
import UserList from './pages/UserList';
import AddUser from './pages/AddUser';
import AddCustomer from './pages/AddCustomer';
import CustomerList from './pages/CustomerList';
import EditCustomer from './pages/EditCustomer';
import VehicleList from './pages/VehicleList';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import TripList from './pages/TripList';
import AddTrip from './pages/AddTrip';
import EditTrip from './pages/EditTrip';
import DriverList from './pages/DriverList';
import AddDriver from './pages/AddDriver';
import EditDriver from './pages/EditDriver';
import Login from './pages/Login';
import './App.css';

const INITIAL_USERS = [
  { id: 1, name: 'Priya Sharma', email: 'priya@transitops.com', phone: '9876543210', role: 'Teacher', linkedStaff: 'Priya Sharma', status: 'Active', addedDate: '01 Jul 2026' },
  { id: 2, name: 'Anil Singh', email: 'anil@transitops.com', phone: '9876543211', role: 'Accountants', status: 'Active', addedDate: '03 Jul 2026' },
  { id: 3, name: 'Sunita Verma', email: 'sunita@transitops.com', phone: '9876543212', role: 'Operator', status: 'Inactive', addedDate: '05 Jul 2026' },
  { id: 4, name: 'Rajesh Gupta', email: 'rajesh@transitops.com', phone: '9876543213', role: 'Operator', status: 'Active', addedDate: '10 Jul 2026' },
];

const INITIAL_STATS = {
  vehicles: 18,
  activeRoutes: 12,
  operators: 20,
  activeTrips: 6,
  maintenanceJobs: 3,
  completedTrips: 154,
};

const INITIAL_ACTIVITY = [
  { action: 'INSERT', module: 'users', entity_type: 'operator', title: 'Operator added: Rajesh Gupta (rajesh@transitops.com)', timestamp: '12:10:45' },
  { action: 'UPDATE', module: 'dispatch', entity_type: 'vehicle', title: 'Dispatched vehicle VO-402 on Route 10A', timestamp: '09:30:12' },
  { action: 'INSERT', module: 'maintenance', entity_type: 'job', title: 'Created maintenance ticket for Vehicle VO-108', timestamp: '08:15:00' },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [customers, setCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [trips, setTrips] = useState([]);
  const [editingTrip, setEditingTrip] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [editingDriver, setEditingDriver] = useState(null);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [activityLog, setActivityLog] = useState(INITIAL_ACTIVITY);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    showToast('info', 'Logged out successfully.');
  };

  const fetchUsers = () => {
    fetch('/api/users')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then((data) => {
        if (data.status === 'success') {
          const mappedUsers = data.users.map((u) => ({
            id: u.ID,
            name: u.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A',
            email: u.email,
            phone: 'N/A',
            role: u.RoleName || 'Operator',
            status: 'Active',
            addedDate: '12 Jul 2026'
          }));
          setUsers(mappedUsers);

          // Update stats operator count
          setStats((prev) => ({
            ...prev,
            operators: data.users.length,
          }));
        }
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
      });
  };

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch customers');
        return res.json();
      })
      .then((data) => {
        if (data.status === 'success') {
          setCustomers(data.customers);
        }
      })
      .catch((err) => {
        console.error('Error fetching customers:', err);
      });
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchUsers();
      fetchCustomers();
      fetchVehicles();
      fetchTrips();
      fetchDrivers();
    }
  }, [isLoggedIn]);

  const handleToggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
          showToast('info', `User ${u.name} status updated to ${nextStatus}.`);
          // Add to activity log
          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'UPDATE',
              module: 'users',
              entity_type: 'user',
              title: `User ${u.name} status changed to ${nextStatus}`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleDeleteUser = (id) => {
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) return;
    if (window.confirm(`Are you sure you want to permanently delete user ${userToDelete.name}?`)) {
      fetch('/api/remove_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userID: id })
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to delete user');
          return res.json();
        })
        .then((data) => {
          if (data.status === 'success') {
            showToast('error', `User ${userToDelete.name} has been deleted.`);
            fetchUsers();
            const now = new Date();
            setActivityLog(logs => [
              {
                action: 'DELETE',
                module: 'users',
                entity_type: 'user',
                title: `User deleted: ${userToDelete.name} (${userToDelete.email})`,
                timestamp: now.toTimeString().split(' ')[0]
              },
              ...logs
            ]);
          } else {
            showToast('error', data.message || 'Failed to delete user.');
          }
        })
        .catch((err) => {
          showToast('error', err.message);
        });
    }
  };

  const handleAddUser = (newUserData) => {
    fetch('/api/add_user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: newUserData.email,
        password: newUserData.password,
        roleID: newUserData.roleID
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to create user');
        }
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', `User ${newUserData.name} added successfully.`);
          fetchUsers();
          setActivePage('users');

          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'INSERT',
              module: 'users',
              entity_type: 'user',
              title: `User added: ${newUserData.name} (${newUserData.email})`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
        } else {
          showToast('error', data.message || 'Failed to add user.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const handleAddCustomer = (newCustomerData) => {
    fetch('/api/add_customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newCustomerData)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to create customer');
        }
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', `Customer ${newCustomerData.name} added successfully.`);
          fetchCustomers();
          setActivePage('customers');

          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'INSERT',
              module: 'customers',
              entity_type: 'customer',
              title: `Customer added: ${newCustomerData.name} (${newCustomerData.mobile_no})`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
        } else {
          showToast('error', data.message || 'Failed to add customer.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const handleEditCustomer = (updatedCustomerData) => {
    fetch('/api/edit_customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedCustomerData)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to update customer');
        }
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', `Customer ${updatedCustomerData.name} updated successfully.`);
          fetchCustomers();
          setActivePage('customers');
          setEditingCustomer(null);

          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'UPDATE',
              module: 'customers',
              entity_type: 'customer',
              title: `Customer updated: ${updatedCustomerData.name} (${updatedCustomerData.mobile_no})`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
        } else {
          showToast('error', data.message || 'Failed to update customer.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const handleDeleteCustomer = (customerID) => {
    const custToDelete = customers.find(c => c.CustomerID === customerID);
    if (!custToDelete) return;
    if (window.confirm(`Are you sure you want to permanently delete customer ${custToDelete.name}?`)) {
      fetch('/api/remove_customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customerID })
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to delete customer');
          return res.json();
        })
        .then((data) => {
          if (data.status === 'success') {
            showToast('error', `Customer ${custToDelete.name} has been deleted.`);
            fetchCustomers();
            const now = new Date();
            setActivityLog(logs => [
              {
                action: 'DELETE',
                module: 'customers',
                entity_type: 'customer',
                title: `Customer deleted: ${custToDelete.name} (${custToDelete.mobile_no})`,
                timestamp: now.toTimeString().split(' ')[0]
              },
              ...logs
            ]);
          } else {
            showToast('error', data.message || 'Failed to delete customer.');
          }
        })
        .catch((err) => {
          showToast('error', err.message);
        });
    }
  };

  const fetchVehicles = () => {
    fetch('/api/vehicles')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch vehicles');
        return res.json();
      })
      .then((data) => {
        if (data.status === 'success') {
          setVehicles(data.vehicles);
        }
      })
      .catch((err) => {
        console.error('Error fetching vehicles:', err);
      });
  };

  const handleAddVehicle = (newVehicleData) => {
    fetch('/api/add_vehicle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newVehicleData)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to register vehicle');
        }
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', `Vehicle ${newVehicleData.plate_no} registered successfully.`);
          fetchVehicles();
          setActivePage('vehicle');

          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'INSERT',
              module: 'vehicle',
              entity_type: 'vehicle',
              title: `Vehicle added: ${newVehicleData.plate_no} (${newVehicleData.vehicle_type})`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
        } else {
          showToast('error', data.message || 'Failed to add vehicle.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const handleEditVehicle = (updatedVehicleData) => {
    fetch('/api/update_vehicle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedVehicleData)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to update vehicle');
        }
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', `Vehicle ${updatedVehicleData.plate_no} updated successfully.`);
          fetchVehicles();
          setActivePage('vehicle');
          setEditingVehicle(null);

          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'UPDATE',
              module: 'vehicle',
              entity_type: 'vehicle',
              title: `Vehicle updated: ${updatedVehicleData.plate_no} (${updatedVehicleData.status})`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
        } else {
          showToast('error', data.message || 'Failed to update vehicle.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const handleDeleteVehicle = (vehicleID) => {
    const vToDelete = vehicles.find(v => v.VehicleID === vehicleID);
    if (!vToDelete) return;
    if (window.confirm(`Are you sure you want to permanently delete vehicle ${vToDelete.plate_no}?`)) {
      fetch('/api/remove_vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vehicleID })
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to delete vehicle');
          return res.json();
        })
        .then((data) => {
          if (data.status === 'success') {
            showToast('error', `Vehicle ${vToDelete.plate_no} has been deleted.`);
            fetchVehicles();
            const now = new Date();
            setActivityLog(logs => [
              {
                action: 'DELETE',
                module: 'vehicle',
                entity_type: 'vehicle',
                title: `Vehicle deleted: ${vToDelete.plate_no}`,
                timestamp: now.toTimeString().split(' ')[0]
              },
              ...logs
            ]);
          } else {
            showToast('error', data.message || 'Failed to delete vehicle.');
          }
        })
        .catch((err) => {
          showToast('error', err.message);
        });
    }
  };

  const handleAddDocument = (vehicleID, documentName, filepath) => {
    fetch('/api/add_vehicle_document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ VehicleID: vehicleID, DocumentName: documentName, filepath: filepath })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to add document');
        }
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', `Document "${documentName}" linked successfully.`);
          fetchVehicles();
        } else {
          showToast('error', data.message || 'Failed to add document.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const handleDeleteDocument = (docID) => {
    fetch('/api/delete_vehicle_document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ID: docID })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to delete document');
        }
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('info', `Document removed.`);
          fetchVehicles();
        } else {
          showToast('error', data.message || 'Failed to delete document.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const fetchTrips = () => {
    fetch('/api/trip_list')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch trips');
        return res.json();
      })
      .then((data) => {
        if (data.status === 'success') {
          setTrips(data.trips);
          const activeCount = data.trips.filter(t => (t.status || 'pending').toLowerCase() === 'pending').length;
          const completedCount = data.trips.filter(t => (t.status || '').toLowerCase() === 'completed').length;
          setStats(prev => ({
            ...prev,
            activeTrips: activeCount,
            completedTrips: completedCount
          }));
        }
      })
      .catch((err) => {
        console.error('Error fetching trips:', err);
      });
  };

  const handleAddTrip = (newTripData) => {
    fetch('/api/add_trip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newTripData)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to dispatch trip');
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', 'Trip dispatched successfully.');
          fetchTrips();
          setActivePage('trips');
          
          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'INSERT',
              module: 'trip',
              entity_type: 'trip',
              title: `Trip dispatched: cargo weight ${newTripData.cargo_weight} kg`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
        } else {
          showToast('error', data.message || 'Failed to add trip.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const handleEditTrip = (updatedTripData) => {
    fetch('/api/update_trip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedTripData)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update trip');
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', 'Trip updated successfully.');
          fetchTrips();
          setActivePage('trips');
          setEditingTrip(null);
          
          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'UPDATE',
              module: 'trip',
              entity_type: 'trip',
              title: `Trip ID ${updatedTripData.ID} updated (${updatedTripData.status})`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
        } else {
          showToast('error', data.message || 'Failed to update trip.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const handleDeleteTrip = (tripID) => {
    if (window.confirm('Are you sure you want to permanently cancel/delete this trip?')) {
      fetch('/api/delete_trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ID: tripID })
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to delete trip');
          return res.json();
        })
        .then((data) => {
          if (data.status === 'success') {
            showToast('error', 'Trip has been canceled and removed.');
            fetchTrips();
          } else {
            showToast('error', data.message || 'Failed to delete trip.');
          }
        })
        .catch((err) => {
          showToast('error', err.message);
        });
    }
  };

  const handleCompleteTrip = (tripID) => {
    fetch('/api/update_trip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ID: tripID, status: 'completed' })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to complete trip');
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', 'Trip completed successfully!');
          fetchTrips();
          
          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'UPDATE',
              module: 'trip',
              entity_type: 'trip',
              title: `Trip ID ${tripID} marked COMPLETED`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
        } else {
          showToast('error', data.message || 'Failed to complete trip.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const fetchDrivers = () => {
    fetch('/api/driver_list')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch drivers');
        return res.json();
      })
      .then((data) => {
        if (data.status === 'success') {
          setDrivers(data.drivers);
        }
      })
      .catch((err) => {
        console.error('Error fetching drivers:', err);
      });
  };

  const handleAddDriver = (newDriverData) => {
    fetch('/api/add_driver', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newDriverData)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to add driver');
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', 'Driver registered successfully!');
          fetchDrivers();
          setActivePage('drivers');
          
          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'INSERT',
              module: 'drivers',
              entity_type: 'driver',
              title: `Registered driver: ${newDriverData.name}`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
        } else {
          showToast('error', data.message || 'Failed to add driver.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const handleEditDriver = (updatedDriverData) => {
    fetch('/api/update_driver', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedDriverData)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update driver');
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', 'Driver profile updated!');
          fetchDrivers();
          setEditingDriver(null);
          setActivePage('drivers');
          
          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'UPDATE',
              module: 'drivers',
              entity_type: 'driver',
              title: `Updated driver profile: ${updatedDriverData.name}`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
        } else {
          showToast('error', data.message || 'Failed to update driver.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const handleDeleteDriver = (driverId) => {
    fetch(`/api/delete_driver?DriverID=${driverId}`, {
      method: 'DELETE'
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to delete driver');
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('info', 'Driver removed from register.');
          fetchDrivers();
          
          const now = new Date();
          setActivityLog(logs => [
            {
              action: 'DELETE',
              module: 'drivers',
              entity_type: 'driver',
              title: `Removed driver ID ${driverId}`,
              timestamp: now.toTimeString().split(' ')[0]
            },
            ...logs
          ]);
        } else {
          showToast('error', data.message || 'Failed to delete driver.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const handleAddDriverDocument = (driverId, docName, docPath) => {
    fetch('/api/add_driver_document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        DriverID: driverId,
        DocumentName: docName,
        filepath: docPath
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to link document');
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('success', 'Document linked successfully!');
          fetchDrivers();
        } else {
          showToast('error', data.message || 'Failed to link document.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  const handleDeleteDriverDocument = (docId) => {
    fetch(`/api/delete_driver_document?ID=${docId}`, {
      method: 'DELETE'
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to delete document');
        return data;
      })
      .then((data) => {
        if (data.status === 'success') {
          showToast('info', 'Document unlinked.');
          fetchDrivers();
        } else {
          showToast('error', data.message || 'Failed to delete document.');
        }
      })
      .catch((err) => {
        showToast('error', err.message);
      });
  };

  if (!isLoggedIn) {
    return (
      <div className="login-root">
        {toast && (
          <div className={`notif-toast ${toast.type}`}>
            <div className="notif-icon">
              {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
              {toast.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
              {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
            </div>
            <div className="notif-body text-start">{toast.message}</div>
            <button className="notif-close" onClick={() => setToast(null)}>&times;</button>
          </div>
        )}
        <Login onLoginSuccess={() => {
          setIsLoggedIn(true);
          showToast('success', 'Logged in successfully as Administrator.');
        }} />
      </div>
    );
  }

  return (
    <div className="wrapper">
      {/* Toast Notification Container */}
      {toast && (
        <div className={`notif-toast ${toast.type}`}>
          <div className="notif-icon">
            {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
            {toast.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
            {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
          </div>
          <div className="notif-body text-start">{toast.message}</div>
          <button className="notif-close" onClick={() => setToast(null)}>&times;</button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        activePage={activePage}
        onChangePage={setActivePage}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <TopNavbar
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          activePage={activePage}
          onLogout={handleLogout}
        />

        <div className="container-fluid py-4 px-3" style={{ flexGrow: 1 }}>
          {activePage === 'dashboard' && (
            <Dashboard
              stats={stats}
              onNavigate={setActivePage}
              activityLog={activityLog}
              vehicles={vehicles}
              customers={customers}
              users={users}
              trips={trips}
              drivers={drivers}
            />
          )}

          {activePage === 'users' && (
            <UserList
              users={users}
              onToggleStatus={handleToggleStatus}
              onDeleteUser={handleDeleteUser}
              onAddUserClick={() => setActivePage('add-user')}
            />
          )}

          {activePage === 'add-user' && (
            <AddUser
              onAddUser={handleAddUser}
              onCancel={() => setActivePage('users')}
            />
          )}

          {activePage === 'customers' && (
            <CustomerList
              customers={customers}
              onDeleteCustomer={handleDeleteCustomer}
              onAddCustomerClick={() => setActivePage('add-customer')}
              onEditCustomerClick={(c) => {
                setEditingCustomer(c);
                setActivePage('edit-customer');
              }}
            />
          )}

          {activePage === 'add-customer' && (
            <AddCustomer
              onAddCustomer={handleAddCustomer}
              onCancel={() => setActivePage('customers')}
            />
          )}

          {activePage === 'edit-customer' && (
            <EditCustomer
              customer={editingCustomer}
              onEditCustomer={handleEditCustomer}
              onCancel={() => {
                setEditingCustomer(null);
                setActivePage('customers');
              }}
            />
          )}

          {activePage === 'vehicle' && (
            <VehicleList
              vehicles={vehicles}
              onDeleteVehicle={handleDeleteVehicle}
              onAddVehicleClick={() => setActivePage('add-vehicle')}
              onEditVehicleClick={(v) => {
                setEditingVehicle(v);
                setActivePage('edit-vehicle');
              }}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {activePage === 'add-vehicle' && (
            <AddVehicle
              onAddVehicle={handleAddVehicle}
              onCancel={() => setActivePage('vehicle')}
            />
          )}

          {activePage === 'edit-vehicle' && (
            <EditVehicle
              vehicle={editingVehicle}
              onEditVehicle={handleEditVehicle}
              onCancel={() => {
                setEditingVehicle(null);
                setActivePage('vehicle');
              }}
            />
          )}

          {activePage === 'trips' && (
            <TripList
              trips={trips}
              onAddTripClick={() => setActivePage('add-trip')}
              onEditTripClick={(t) => {
                setEditingTrip(t);
                setActivePage('edit-trip');
              }}
              onDeleteTrip={handleDeleteTrip}
              onCompleteTrip={handleCompleteTrip}
            />
          )}

          {activePage === 'add-trip' && (
            <AddTrip
              vehicles={vehicles}
              customers={customers}
              drivers={drivers}
              onAddTrip={handleAddTrip}
              onCancel={() => setActivePage('trips')}
            />
          )}

          {activePage === 'edit-trip' && (
            <EditTrip
              trip={editingTrip}
              vehicles={vehicles}
              customers={customers}
              drivers={drivers}
              onEditTrip={handleEditTrip}
              onCancel={() => {
                setEditingTrip(null);
                setActivePage('trips');
              }}
            />
          )}

          {activePage === 'drivers' && (
            <DriverList
              drivers={drivers}
              onDeleteDriver={handleDeleteDriver}
              onAddDriverClick={() => setActivePage('add-driver')}
              onEditDriverClick={(d) => {
                setEditingDriver(d);
                setActivePage('edit-driver');
              }}
              onAddDocument={handleAddDriverDocument}
              onDeleteDocument={handleDeleteDriverDocument}
            />
          )}

          {activePage === 'add-driver' && (
            <AddDriver
              onAddDriver={handleAddDriver}
              onCancel={() => setActivePage('drivers')}
            />
          )}

          {activePage === 'edit-driver' && (
            <EditDriver
              driver={editingDriver}
              onEditDriver={handleEditDriver}
              onCancel={() => {
                setEditingDriver(null);
                setActivePage('drivers');
              }}
            />
          )}

          {/* Under construction fallbacks for other menus */}
          {activePage !== 'dashboard' && activePage !== 'users' && activePage !== 'add-user' && activePage !== 'customers' && activePage !== 'add-customer' && activePage !== 'edit-customer' && activePage !== 'vehicle' && activePage !== 'add-vehicle' && activePage !== 'edit-vehicle' && activePage !== 'drivers' && activePage !== 'add-driver' && activePage !== 'edit-driver' && activePage !== 'trips' && activePage !== 'add-trip' && activePage !== 'edit-trip' && (
            <div className="row justify-content-center align-items-center py-5">
              <div className="col-12 col-md-8 col-lg-6 text-center">
                <div className="card border-0 shadow-sm p-5" style={{ borderRadius: '16px' }}>
                  <i className="fas fa-tools fa-3x text-primary mb-3"></i>
                  <h4 className="fw-bold mb-2">Module Preview</h4>
                  <p className="text-muted mb-4">
                    The <strong>{activePage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</strong> module is currently in mock preview mode.
                  </p>
                  <button className="btn btn-primary" onClick={() => setActivePage('dashboard')}>
                    <i className="fas fa-arrow-left me-2"></i>Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
