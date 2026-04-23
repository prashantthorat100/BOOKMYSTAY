import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Map from '../components/Map';
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

function readUser() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function getStatusBadge(status) {
  const badges = {
    confirmed: 'badge-success',
    pending: 'badge-warning',
    cancelled: 'badge-error',
    completed: 'badge-success'
  };
  return `badge ${badges[status] || ''}`;
}

export default function MyBookings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  const user = useMemo(() => readUser(), []);
  const role = user?.role || 'guest';
  const title = role === 'host' ? 'My Bookings (as Host)' : 'My Bookings';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = role === 'host' ? '/api/bookings/host' : '/api/bookings/user';
      const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/bookings/${bookingId}`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Could not cancel booking');
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-2xl)', minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <Link to="/" className="btn btn-outline">Explore stays</Link>
      </div>

      {bookings.length === 0 ? (
        <div style={{ padding: 'var(--spacing-2xl) 0', borderTop: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>No bookings yet</h3>
          <p style={{ color: 'var(--neutral-500)', marginBottom: 'var(--spacing-lg)' }}>
            {role === 'host' ? 'When guests book your properties, they will appear here.' : 'Book a stay to see it here.'}
          </p>
          <button onClick={() => navigate('/')} className="btn btn-outline">Start searching</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-xl)' }}>
          {bookings.map((b) => {
            const images = parseImages(b?.images);
            const firstImage = images.length > 0
              ? resolveAssetUrl(images[0])
              : 'https://via.placeholder.com/500x320?text=No+Image';

            const propertyLink = b.property_id ? `/property/${b.property_id}` : null;
            const locationText = [b.address, b.city, b.country].filter(Boolean).join(', ');

            return (
              <div key={b.id} className="card" style={{ padding: 'var(--spacing-md)', display: 'grid', gap: '0.75rem' }}>
                <div
                  onClick={() => propertyLink && navigate(propertyLink)}
                  style={{ width: '100%', aspectRatio: '1.6 / 1', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: propertyLink ? 'pointer' : 'default' }}
                >
                  <img
                    src={firstImage}
                    alt={b.title || 'Booking'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => (e.target.src = 'https://via.placeholder.com/500x320?text=No+Image')}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.75rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.title || b.city || 'Booking'}
                    </div>
                    <div style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
                      {new Date(b.check_in).toLocaleDateString()} – {new Date(b.check_out).toLocaleDateString()}
                    </div>
                    {role === 'guest' ? (
                      <div style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
                        Hosted by <span style={{ fontWeight: 600, color: 'var(--neutral-700)' }}>{b.host_name || 'Host'}</span>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
                        Guest: <span style={{ fontWeight: 600, color: 'var(--neutral-700)' }}>{b.guest_name || 'Guest'}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', justifyItems: 'end', gap: '0.35rem' }}>
                    <span className={getStatusBadge(b.status)} style={{ fontSize: '0.75rem' }}>
                      {(b.status || '').toUpperCase()}
                    </span>
                    <div style={{ fontWeight: 800 }}>₹{b.total_price}</div>
                  </div>
                </div>

                <div>
                  <Map
                    latitude={b.latitude}
                    longitude={b.longitude}
                    title={b.title}
                    height={180}
                  />
                  {locationText && (
                    <div style={{ marginTop: '0.5rem', color: 'var(--neutral-500)', fontSize: '0.85rem' }}>
                      📍 {locationText}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {propertyLink && (
                    <button className="btn btn-outline" type="button" onClick={() => navigate(propertyLink)}>
                      View property
                    </button>
                  )}
                  {role === 'guest' && b.status === 'confirmed' && (
                    <button className="btn btn-outline" type="button" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => cancelBooking(b.id)}>
                      Cancel booking
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
