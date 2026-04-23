import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { resolveAssetUrl } from '../utils/api';

function parseImages(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseUser(value) {
  if (value == null || value === '') return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function HostDashboard() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutDetails, setPayoutDetails] = useState({ upi_id: '', bank_account: '', ifsc_code: '', beneficiary_name: '' });
  const [payoutSaving, setPayoutSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = parseUser(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'host') {
      navigate('/login');
      return;
    }
    
    fetchProperties();
    fetchBookings();
    fetchPayoutDetails();
  }, []);

  const fetchPayoutDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/host/payout-details', { headers: { Authorization: `Bearer ${token}` } });
      setPayoutDetails(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    setPayoutSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/host/payout-details', payoutDetails, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Payout details saved. You can receive payments for your bookings here.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setPayoutSaving(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = parseUser(localStorage.getItem('user'));
      if (!user) return;
      
      const response = await axios.get('/api/properties');
      const userProperties = response.data.filter(p => p.host_id === user.id);
      setProperties(userProperties);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bookings/host', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getImageUrl = (img) => {
    if (!img) return 'https://via.placeholder.com/400x300?text=No+Image';
    return resolveAssetUrl(img);
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/properties/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (err) {
      toast.error('Failed to delete property');
    }
  };

  const setPropertyLocation = async (propertyId) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const token = localStorage.getItem('token');
          const formData = new FormData();
          formData.append('latitude', latitude);
          formData.append('longitude', longitude);

          // Also reverse-geocode for address/city/country
          if (window.google?.maps?.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat: latitude, lng: longitude } }, async (results, status) => {
              if (status === 'OK' && results[0]) {
                const addr = results[0].address_components || [];
                let city = '';
                let country = '';
                addr.forEach(c => {
                  if (c.types.includes('locality')) city = c.long_name;
                  if (c.types.includes('country')) country = c.long_name;
                  if (!city && c.types.includes('administrative_area_level_2')) city = c.long_name;
                });
                if (results[0].formatted_address) formData.append('address', results[0].formatted_address);
                if (city) formData.append('city', city);
                if (country) formData.append('country', country);
              }
              await axios.put(`/api/properties/${propertyId}`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
              });
              toast.success('Location set successfully!');
              fetchProperties();
            });
          } else {
            await axios.put(`/api/properties/${propertyId}`, formData, {
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Location coordinates saved! (Address not auto-filled — Google Maps not loaded)');
            fetchProperties();
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to save location');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not detect your location. Please check your browser permissions.');
      }
    );
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-2xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h1>Host Dashboard</h1>
        <button onClick={() => navigate('/host/add-property')} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '50px' }}>
          + Add New Property
        </button>
      </div>

      {/* Payout details for receiving payments */}
      <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Payment receiving information</h2>
        <p style={{ color: 'var(--neutral-400)', marginBottom: 'var(--spacing-md)', fontSize: '0.9rem' }}>
          Fill this so we can send you payouts for your property bookings (Razorpay).
        </p>
        <form onSubmit={handlePayoutSubmit} className="card" style={{ maxWidth: '500px' }}>
          <div className="form-group">
            <label className="form-label">UPI ID</label>
            <input
              type="text"
              value={payoutDetails.upi_id}
              onChange={e => setPayoutDetails(prev => ({ ...prev, upi_id: e.target.value }))}
              className="form-input"
              placeholder="yourname@upi"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Beneficiary name</label>
            <input
              type="text"
              value={payoutDetails.beneficiary_name}
              onChange={e => setPayoutDetails(prev => ({ ...prev, beneficiary_name: e.target.value }))}
              className="form-input"
              placeholder="Account holder name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Bank account number</label>
            <input
              type="text"
              value={payoutDetails.bank_account}
              onChange={e => setPayoutDetails(prev => ({ ...prev, bank_account: e.target.value }))}
              className="form-input"
              placeholder="Bank account number"
            />
          </div>
          <div className="form-group">
            <label className="form-label">IFSC code</label>
            <input
              type="text"
              value={payoutDetails.ifsc_code}
              onChange={e => setPayoutDetails(prev => ({ ...prev, ifsc_code: e.target.value }))}
              className="form-input"
              placeholder="e.g. SBIN0001234"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={payoutSaving}>
            {payoutSaving ? 'Saving...' : 'Save payout details'}
          </button>
        </form>
      </section>

      {/* Properties Section */}
      <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>My Properties ({properties.length})</h2>
        
        {properties.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--spacing-2xl) 0' }}>
            <h3>No properties listed yet</h3>
            <p>Start earning by listing your first property!</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {properties.map(property => {
              const images = parseImages(property?.images);
              const firstImage = images.length > 0 
                ? getImageUrl(images[0])
                : 'https://via.placeholder.com/400x300?text=No+Image';

              return (
                <div key={property.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <img 
                    src={firstImage} 
                    alt={property.title}
                    className="card-image"
                    style={{ height: '200px', width: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-md)' }}
                    onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'}
                  />
                  <h3 style={{ marginBottom: 'var(--spacing-sm)', fontSize: '1.1rem' }}>{property.title}</h3>
                  <p style={{ color: 'var(--neutral-400)', marginBottom: 'var(--spacing-md)', fontSize: '0.9rem' }}>
                    📍 {property.city}, {property.country}
                  </p>
                  
                  <div style={{ flexGrow: 1 }}></div>

                  {(!property.latitude || !property.longitude) && (
                    <div style={{
                      padding: 'var(--spacing-sm)',
                      background: 'rgba(255, 165, 0, 0.1)',
                      border: '1px solid rgba(255, 165, 0, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--spacing-md)',
                      fontSize: '0.8rem',
                      color: '#b86e00',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)'
                    }}>
                      ⚠️ No map location set —
                      <button
                        type="button"
                        onClick={() => setPropertyLocation(property.id)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--primary)',
                          cursor: 'pointer', textDecoration: 'underline', padding: 0,
                          fontSize: '0.8rem', fontWeight: 600
                        }}
                      >
                        📍 Use current location
                      </button>
                    </div>
                  )}
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
                    ₹{property.price_per_night} <span style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', fontWeight: 400 }}>/ night</span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button 
                      onClick={() => navigate(`/host/edit-property/${property.id}`)}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.5rem' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => navigate(`/property/${property.id}`)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.5rem' }}
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleDeleteProperty(property.id)}
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '0.5rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bookings Section */}
      <section>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Recent Bookings ({bookings.length})</h2>
        
        {bookings.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--spacing-2xl) 0' }}>
            <p style={{ margin: 0, color: 'var(--neutral-500)' }}>No bookings yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {bookings.slice(0, 5).map(booking => (
              <div key={booking.id} className="card" style={{ padding: '1rem 1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>{booking.title}</strong>
                    <p style={{ color: 'var(--neutral-500)', marginBottom: 0, fontSize: '0.875rem' }}>
                      Guest: {booking.guest_name}
                    </p>
                  </div>
                  <div style={{ color: 'var(--neutral-600)', fontSize: '0.9rem' }}>
                    📅 {new Date(booking.check_in).toLocaleDateString()}
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--neutral-600)' }}>
                    ₹{booking.total_price}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      backgroundColor: booking.status === 'confirmed' ? 'rgba(0,166,153,0.1)' : 'rgba(255,165,0,0.1)',
                      color: booking.status === 'confirmed' ? 'var(--success)' : '#b86e00',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default HostDashboard;
