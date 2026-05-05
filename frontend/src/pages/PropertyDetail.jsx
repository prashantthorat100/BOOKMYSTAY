import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { differenceInCalendarDays } from 'date-fns';
import toast from 'react-hot-toast';
import Map from '../components/Map';
import ImageSlider from '../components/ImageSlider';
import ChatBox from '../components/ChatBox';
import { reverseGeocode } from '../utils/googleMaps';

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
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
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

  const submitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      setReviewLoading(true);
      await axios.post('/api/reviews', {
        property_id: id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Review submitted');
      setReviewForm({ rating: 5, comment: '' });
      fetchReviews();
      fetchProperty();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  // ── Standard Razorpay Checkout (QR / Cards / UPI — user chooses in modal) ──
  const handleBooking = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey || !window.Razorpay) {
      toast.error('Payment is not configured on this app');
      return;
    }

    setBookingLoading(true);
    try {
      // 1. Create a Razorpay order on the backend
      const orderRes = await axios.post('/api/payments/create-order', {
        property_id: id,
        check_in: bookingData.check_in,
        check_out: bookingData.check_out,
        guests_count: Number(bookingData.guests_count)
      }, { headers: { Authorization: `Bearer ${token}` } });

      const { orderId, amountPaise, currency } = orderRes.data;

      // 2. Open standard Razorpay checkout modal
      const options = {
        key: razorpayKey,
        amount: amountPaise,
        currency: currency || 'INR',
        order_id: orderId,
        name: 'BookMyStay',
        description: `Booking: ${property?.title || 'Property'}`,
        handler: async function (response) {
          try {
            toast.loading('Confirming booking…', { id: 'book-confirm' });
            const verifyRes = await axios.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              property_id: id,
              check_in: bookingData.check_in,
              check_out: bookingData.check_out,
              guests_count: Number(bookingData.guests_count)
            }, { headers: { Authorization: `Bearer ${token}` } });

            toast.success(`🎉 Booking confirmed! Total: ₹${verifyRes.data.totalPrice}`, { id: 'book-confirm' });
            setTimeout(() => navigate('/dashboard'), 2200);
          } catch (err) {
            toast.error(err.response?.data?.error || 'Booking confirmation failed', { id: 'book-confirm' });
          } finally {
            setBookingLoading(false);
          }
        },
        modal: { ondismiss: () => setBookingLoading(false) }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        toast.error(`Payment failed: ${resp.error.description}`);
        setBookingLoading(false);
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
      toast.error('Geolocation is not supported by your browser');
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

          try {
            const locationInfo = await reverseGeocode(latitude, longitude);
            if (locationInfo?.address) formData.append('address', locationInfo.address);
            if (locationInfo?.city) formData.append('city', locationInfo.city);
            if (locationInfo?.country) formData.append('country', locationInfo.country);
          } catch (geocodeErr) {
            console.error('Reverse geocoding error:', geocodeErr);
            // Non-blocking for owners: coordinates still get saved.
            toast('Location set. Address autofill unavailable right now.');
          }

          await axios.put(`/api/properties/${id}`, formData, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          });
          setLocationSetting(false);
          fetchProperty(); // refresh to show the map
        } catch (err) {
          console.error(err);
          setLocationSetting(false);
          toast.error('Failed to set location');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationSetting(false);
        toast.error('Could not detect your location. Please allow browser location permission.');
      }
    );
  };

  const openDirections = () => {
    const destLat = parseFloat(property.latitude);
    const destLng = parseFloat(property.longitude);
    const hasDest = !Number.isNaN(destLat) && !Number.isNaN(destLng);
    if (!hasDest) {
      toast.error('Property location is not set yet.');
      return;
    }

    const openUrl = (origin) => {
      const base = 'https://www.google.com/maps/dir/?api=1';
      const destination = `destination=${encodeURIComponent(`${destLat},${destLng}`)}`;
      const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : '';
      const url = `${base}${originParam}&${destination}&travelmode=driving`;
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (!navigator.geolocation) {
      openUrl(null);
      return;
    }

    toast.loading('Getting your location for directions...', { id: 'dir' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('dir');
        const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
        openUrl(origin);
      },
      () => {
        toast.dismiss('dir');
        openUrl(null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Derived booking info
  let nights = 0;
  let totalPrice = 0;
  const discountPercent = Number(property.discount_percentage || 0);
  const discountedPricePerNight = discountPercent > 0
    ? Math.max(0, Math.round((property.price_per_night * (100 - discountPercent)) / 100))
    : property.price_per_night;
  if (bookingData.check_in && bookingData.check_out && bookingData.check_out > bookingData.check_in) {
    nights = differenceInCalendarDays(
      new Date(bookingData.check_out),
      new Date(bookingData.check_in)
    );
    if (nights > 0) {
      totalPrice = nights * discountedPricePerNight;
    }
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-2xl)' }}>
      {/* Image Slider Gallery */}
      <section className="detail-gallery" style={{ marginBottom: 'var(--spacing-2xl)', borderRadius: 'var(--radius-lg)', height: '380px', backgroundColor: 'var(--neutral-100)', overflow: 'hidden' }}>
        <ImageSlider images={images} />
      </section>

      <div className="detail-grid grid grid-3" style={{ gap: 'var(--spacing-2xl)', alignItems: 'start' }}>
        {/* Property Info */}
        <div className="detail-main" style={{ gridColumn: 'span 2' }}>
          <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>{property.title}</h1>
          <p style={{ color: 'var(--neutral-400)', marginBottom: 'var(--spacing-lg)' }}>
            📍 {property.address || ''} {property.city}, {property.country}
          </p>

          <div className="detail-stats" style={{ display: 'flex', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
            <span>🛏️ {property.bedrooms} Bedrooms</span>
            <span>🚿 {property.bathrooms} Bathrooms</span>
            <span>👥 {property.max_guests} Guests</span>
            <span>⭐ {rating} ({property.review_count} reviews)</span>
          </div>

          <div className="card">
            <h3>About this place</h3>
            <p>{property.description || 'No description available'}</p>
            {(property.offer_title || discountPercent > 0) && (
              <div style={{ marginTop: 'var(--spacing-md)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,166,153,0.12)' }}>
                {property.offer_title && <div style={{ fontWeight: 600 }}>{property.offer_title}</div>}
                {discountPercent > 0 && <div>{discountPercent}% OFF available</div>}
                {property.offer_valid_till && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
                    Valid till: {new Date(property.offer_valid_till).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {Array.isArray(property.price_comparisons) && property.price_comparisons.length > 0 && (
            <div className="card" style={{ marginTop: 'var(--spacing-lg)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>compare_arrows</span>
                Price Comparison
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {property.price_comparisons.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontWeight: '700', color: 'var(--on-surface)', fontSize: '1.05rem' }}>{item.platform}</span>
                      {item.url && (
                        <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '500' }} className="comparison-link">
                          View on website ↗
                        </a>
                      )}
                    </div>
                    <span style={{ fontWeight: '800', color: 'var(--on-surface)', fontSize: '1.15rem' }}>₹{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {amenities.length > 0 && (
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
              <h3>Amenities</h3>
              <div className="amenities-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-sm)' }}>
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
              height={380}
            />
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-outline" onClick={openDirections}>
                Get directions
              </button>
              {isOwner && (!property.latitude || !property.longitude) && (
                <button 
                  type="button" 
                  onClick={setLocationFromHere}
                  className="btn btn-secondary"
                  disabled={locationSetting}
                >
                  {locationSetting ? '⌛ Setting location...' : '📍 Set location using my current position'}
                </button>
              )}
            </div>
            <p style={{ marginTop: 'var(--spacing-sm)', color: 'var(--neutral-400)', fontSize: '0.875rem' }}>
              {property.address || ''} {property.city}, {property.country}
            </p>
          </div>

          {/* Reviews */}
          <div style={{ marginTop: 'var(--spacing-xl)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Reviews</h3>
            {currentUser && !isOwner && (
              <form onSubmit={submitReview} className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Share your experience</h4>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select
                    className="form-select"
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm((p) => ({ ...p, rating: e.target.value }))}
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Very good</option>
                    <option value={3}>3 - Good</option>
                    <option value={2}>2 - Poor</option>
                    <option value={1}>1 - Very poor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Comment</label>
                  <textarea
                    className="form-textarea"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                    placeholder="How was your stay?"
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={reviewLoading}>
                  {reviewLoading ? 'Submitting...' : 'Submit review'}
                </button>
              </form>
            )}
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
        <div className="detail-sidebar" style={{ position: 'sticky', top: '100px' }}>
          <div className="card">
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              {discountPercent > 0 ? (
                <div>
                  <span style={{ fontSize: '1rem', color: 'var(--neutral-400)', textDecoration: 'line-through', marginRight: '0.5rem' }}>
                    ₹{property.price_per_night}
                  </span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>₹{discountedPricePerNight}</span>
                </div>
              ) : (
                <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                  ₹{property.price_per_night}
                </span>
              )}
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



            <form onSubmit={handleBooking}>
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
                <div style={{
                  padding: 'var(--spacing-md)',
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  marginBottom: 'var(--spacing-lg)',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>₹{discountedPricePerNight} × {nights} night{nights > 1 ? 's' : ''}</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <hr style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '0.5rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
                    <span>Total</span>
                    <span style={{ color: '#FFB400' }}>₹{totalPrice}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '1rem', padding: '0.9rem' }}
                disabled={bookingLoading || (availability === false)}
              >
                {bookingLoading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, margin: 0 }}/>Processing…</span>
                  : '🔒 Reserve & Pay'
                }
              </button>
            </form>




            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-400)', textAlign: 'center', marginTop: 'var(--spacing-md)', marginBottom: 0 }}>
              Pay securely with Razorpay to confirm your booking
            </p>
          </div>

          {/* Chat Feature for Guest */}
          {currentUser && !isOwner && (
            <ChatBox 
              propertyId={id} 
              hostId={property.host_id} 
              hostName={property.host_name}
              currentUserId={currentUser.id} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PropertyDetail;
