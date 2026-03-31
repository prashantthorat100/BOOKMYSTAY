import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

function parseImages(value) {
  if (value == null || value === '') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Dashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bookings/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/bookings/${bookingId}`, 
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (err) {
      toast.error('Failed to cancel booking');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: 'badge-success',
      pending: 'badge-warning',
      cancelled: 'badge-error',
      completed: 'badge-success'
    };
    return `badge ${badges[status] || ''}`;
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-2xl)', minHeight: '80vh' }}>
      <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Trips</h1>

      {bookings.length === 0 ? (
        <div style={{ padding: 'var(--spacing-2xl) 0', borderTop: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>No trips booked... yet!</h3>
          <p style={{ color: 'var(--neutral-500)', marginBottom: 'var(--spacing-lg)' }}>Time to dust off your bags and start planning your next adventure</p>
          <button onClick={() => navigate('/')} className="btn btn-outline" style={{ color: 'var(--neutral-600)', borderColor: 'var(--neutral-600)', borderWidth: '1px' }}>
            Start searching
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-xl)' }}>
          {bookings.map(booking => {
            const images = parseImages(booking?.images);
            const firstImage = images.length > 0 
              ? `/uploads/${images[0]}` 
              : 'https://via.placeholder.com/400x300?text=No+Image';

            return (
              <div key={booking.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ width: '100%', aspectRatio: '1.5 / 1', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <img 
                    src={firstImage} 
                    alt={booking.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'}
                  />
                </div>
                
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--neutral-600)', margin: '0 0 0.25rem 0' }}>{booking.city}</h3>
                  <p style={{ color: 'var(--neutral-400)', fontSize: '0.9rem', margin: '0 0 0.25rem 0' }}>
                    Hosted by {booking.host_name || 'Host'}
                  </p>
                  <p style={{ color: 'var(--neutral-400)', fontSize: '0.9rem', margin: '0 0 0.25rem 0' }}>
                    {new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--neutral-600)' }}>
                      ₹{booking.total_price}
                    </span>
                    <span className={getStatusBadge(booking.status)} style={{ fontSize: '0.75rem' }}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>

                  {booking.status === 'confirmed' && (
                    <button 
                      onClick={() => handleCancelBooking(booking.id)}
                      className="btn btn-outline"
                      style={{ marginTop: '0.75rem', width: '100%', borderColor: 'var(--error)', color: 'var(--error)', padding: '0.5rem' }}
                    >
                      Cancel Booking
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

export default Dashboard;
