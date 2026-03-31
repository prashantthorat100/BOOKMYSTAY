import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { differenceInCalendarDays } from 'date-fns';
import toast from 'react-hot-toast';
import Map from '../components/Map';
import ImageSlider from '../components/ImageSlider';

function parseJsonArray(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    check_in: '',
    check_out: '',
    guests_count: 1
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  const [availability, setAvailability] = useState(null); // null | true | false
  const [locationSetting, setLocationSetting] = useState(false);

  useEffect(() => {
    fetchProperty();
    fetchReviews();
  }, [id]);

  // Check availability when dates change
  useEffect(() => {
    const { check_in, check_out } = bookingData;
    if (!check_in || !check_out) {
      setAvailability(null);
      return;
    }

    if (check_out <= check_in) {
      setAvailability(null);
      return;
    }

    const checkAvailability = async () => {
      try {
        const params = new URLSearchParams({
          property_id: id,
          check_in,
          check_out
        });
        const response = await axios.get(`/api/bookings/check-availability?${params.toString()}`);
        setAvailability(response.data.available);
      } catch (err) {
        console.error(err);
        setAvailability(null);
      }
    };

    checkAvailability();
  }, [id, bookingData.check_in, bookingData.check_out]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get(`/api/properties/${id}`);
      setProperty(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`/api/reviews/property/${id}`);
      setReviews(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayAndBook = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setBookingLoading(true);

    try {
      const orderRes = await axios.post('/api/payments/create-order', {
        property_id: id,
        check_in: bookingData.check_in,
        check_out: bookingData.check_out,
        guests_count: Number(bookingData.guests_count)
      }, { headers: { Authorization: `Bearer ${token}` } });

      const { orderId, amountPaise, amount, currency } = orderRes.data;
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKey || !window.Razorpay) {
        toast.error('Payment is not configured. Add VITE_RAZORPAY_KEY_ID in frontend .env');
        setBookingLoading(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: amountPaise,
        currency: currency || 'INR',
        order_id: orderId,
        name: 'BookMyStay',
        description: `Booking: ${property?.title || 'Property'}`,
        handler: async function (response) {
          try {
            toast.loading('Confirming booking...', { id: 'booking-confirm' });
            const verifyRes = await axios.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              property_id: id,
              check_in: bookingData.check_in,
              check_out: bookingData.check_out,
              guests_count: Number(bookingData.guests_count)
            }, { headers: { Authorization: `Bearer ${token}` } });

            toast.success(`Booking confirmed! Total: ₹${verifyRes.data.totalPrice}`, { id: 'booking-confirm' });
            setTimeout(() => navigate('/dashboard'), 2000);
          } catch (err) {
            toast.error(err.response?.data?.error || 'Booking could not be confirmed', { id: 'booking-confirm' });
          } finally {
            setBookingLoading(false);
          }
        },
        modal: { ondismiss: () => setBookingLoading(false) }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start payment');
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="spinner"></div>;
  if (!property) return <div className="container" style={{ padding: 'var(--spacing-2xl)' }}>Property not found</div>;

  const images = parseJsonArray(property.images);
  const amenities = parseJsonArray(property.amenities);
  const rating = property.avg_rating ? parseFloat(property.avg_rating).toFixed(1) : 'New';

  // Check if current user is the host of this property
  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem('user')); } catch {};
  const isOwner = currentUser && currentUser.id === property.host_id;

  const setLocationFromHere = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocationSetting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const token = localStorage.getItem('token');
          const formData = new FormData();
          formData.append('latitude', latitude);
          formData.append('longitude', longitude);

          // Reverse geocode with Google Geocoding API
          try {
            const geoKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (!geoKey) throw new Error('Missing Google Maps API key');
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${geoKey}`
            );
            const data = await res.json();
            if (data && data.results && data.results.length > 0) {
              const result = data.results[0];
              const components = result.address_components || [];
              const city = components.find(c => c.types.includes('locality'))?.long_name || '';
              const country = components.find(c => c.types.includes('country'))?.long_name || '';
              if (result.formatted_address) formData.append('address', result.formatted_address);
              if (city) formData.append('city', city);
              if (country) formData.append('country', country);
            }
          } catch (geocodeErr) {
            console.error('Reverse geocoding error:', geocodeErr);
          }

          await axios.put(`/api/properties/${id}`, formData, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          });
          setLocationSetting(false);
          fetchProperty(); // refresh to show the map
        } catch (err) {
          console.error(err);
          setLocationSetting(false);
          alert('Failed to set location');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationSetting(false);
        alert('Could not detect your location.');
      }
    );
  };

  // Derived booking info
  let nights = 0;
  let totalPrice = 0;
  if (bookingData.check_in && bookingData.check_out && bookingData.check_out > bookingData.check_in) {
    nights = differenceInCalendarDays(
      new Date(bookingData.check_out),
      new Date(bookingData.check_in)
    );
    if (nights > 0) {
      totalPrice = nights * property.price_per_night;
    }
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-2xl)' }}>
      {/* Image Slider Gallery */}
      <section style={{ marginBottom: 'var(--spacing-2xl)', borderRadius: 'var(--radius-lg)', height: '500px', backgroundColor: 'var(--neutral-100)', overflow: 'hidden' }}>
        <ImageSlider images={images} />
      </section>

      <div className="grid grid-3" style={{ gap: 'var(--spacing-2xl)', alignItems: 'start' }}>
        {/* Property Info */}
        <div style={{ gridColumn: 'span 2' }}>
          <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>{property.title}</h1>
          <p style={{ color: 'var(--neutral-400)', marginBottom: 'var(--spacing-lg)' }}>
            📍 {property.address || ''} {property.city}, {property.country}
          </p>

          <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
            <span>🛏️ {property.bedrooms} Bedrooms</span>
            <span>🚿 {property.bathrooms} Bathrooms</span>
            <span>👥 {property.max_guests} Guests</span>
            <span>⭐ {rating} ({property.review_count} reviews)</span>
          </div>

          <div className="card">
            <h3>About this place</h3>
            <p>{property.description || 'No description available'}</p>
          </div>

          {amenities.length > 0 && (
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
              <h3>Amenities</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-sm)' }}>
                {amenities.map((amenity, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <span>✓</span> {amenity}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Map */}
          <div style={{ marginTop: 'var(--spacing-xl)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Where you'll be</h3>
            <Map 
              latitude={property.latitude} 
              longitude={property.longitude} 
              title={property.title} 
            />
            {isOwner && (!property.latitude || !property.longitude) && (
              <button 
                type="button" 
                onClick={setLocationFromHere}
                className="btn btn-secondary"
                disabled={locationSetting}
                style={{ marginTop: 'var(--spacing-md)' }}
              >
                {locationSetting ? '⌛ Setting location...' : '📍 Set location using my current position'}
              </button>
            )}
            <p style={{ marginTop: 'var(--spacing-sm)', color: 'var(--neutral-400)', fontSize: '0.875rem' }}>
              {property.address || ''} {property.city}, {property.country}
            </p>
          </div>

          {/* Reviews */}
          <div style={{ marginTop: 'var(--spacing-xl)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Reviews</h3>
            {reviews.length === 0 ? (
              <p>No reviews yet</p>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                {reviews.map(review => (
                  <div key={review.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                      <strong>{review.user_name}</strong>
                      <span>⭐ {review.rating}/5</span>
                    </div>
                    <p style={{ marginBottom: 0 }}>{review.comment}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--neutral-400)', marginTop: 'var(--spacing-sm)', marginBottom: 0 }}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Card */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div className="card">
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                ₹{property.price_per_night}
              </span>
              <span style={{ color: 'var(--neutral-400)' }}> / night</span>
            </div>

            {/* Availability status */}
            {availability !== null && (
              <div
                style={{
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-sm)',
                  background: availability
                    ? 'rgba(0, 166, 153, 0.08)'
                    : 'rgba(193, 53, 21, 0.08)',
                  color: availability ? 'var(--success)' : 'var(--error)',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                {availability ? 'This stay is available for your dates' : 'Not available for these dates'}
              </div>
            )}



            <form onSubmit={handlePayAndBook}>
              <div className="form-group">
                <label className="form-label">Check-in</label>
                <input
                  type="date"
                  value={bookingData.check_in}
                  onChange={(e) => setBookingData({ ...bookingData, check_in: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Check-out</label>
                <input
                  type="date"
                  value={bookingData.check_out}
                  onChange={(e) => setBookingData({ ...bookingData, check_out: e.target.value })}
                  min={bookingData.check_in || new Date().toISOString().split('T')[0]}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Guests</label>
                <input
                  type="number"
                  value={bookingData.guests_count}
                  onChange={(e) => setBookingData({ ...bookingData, guests_count: e.target.value })}
                  min="1"
                  max={property.max_guests}
                  required
                  className="form-input"
                />
              </div>

              {/* Price breakdown */}
              {nights > 0 && (
                <div
                  style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--neutral-800)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    marginBottom: 'var(--spacing-lg)',
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>
                      ₹{property.price_per_night} × {nights} night{nights > 1 ? 's' : ''}
                    </span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <hr style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '0.5rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>Total (pay via Razorpay)</span>
                    <span>₹{totalPrice}</span>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={bookingLoading || (availability === false)}
              >
                {bookingLoading ? 'Opening payment...' : 'Pay & Book'}
              </button>
            </form>

            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-400)', textAlign: 'center', marginTop: 'var(--spacing-md)', marginBottom: 0 }}>
              Pay securely with Razorpay to confirm your booking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetail;
