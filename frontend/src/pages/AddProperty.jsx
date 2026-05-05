import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Map from '../components/Map';
import { reverseGeocode, geocodeAddress } from '../utils/googleMaps';

function AddProperty() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'apartment',
    price_per_night: '',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 1,
    address: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    discount_percentage: '',
    offer_title: '',
    offer_valid_till: '',
    price_comparisons: [],
    amenities: []
  });

  // Separate address search state (above map)
  const [addressSearch, setAddressSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [addressSuggestion, setAddressSuggestion] = useState('');

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [comparisonDraft, setComparisonDraft] = useState({ platform: '', price: '', url: '' });
  const debounceRef = useRef(null);

  const amenitiesList = [
    'WiFi', 'Kitchen', 'Parking', 'Air Conditioning', 'Heating',
    'TV', 'Washer', 'Dryer', 'Pool', 'Gym', 'Hot Tub', 'Workspace'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAmenityToggle = (amenity) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.includes(amenity)
        ? formData.amenities.filter(a => a !== amenity)
        : [...formData.amenities, amenity]
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const currentCount = images.length;
    const remainingSlots = Math.max(0, 10 - currentCount);

    const validByType = [];
    const rejectedByType = [];
    const rejectedBySize = [];

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        rejectedByType.push(file.name);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        rejectedBySize.push(file.name);
        return;
      }
      validByType.push(file);
    });

    const accepted = validByType.slice(0, remainingSlots);
    const droppedByLimit = validByType.slice(remainingSlots);

    if (rejectedByType.length) {
      toast.error('Only JPG, PNG, and WEBP images are allowed.');
    }
    if (rejectedBySize.length) {
      toast.error('Each image must be 5MB or smaller.');
    }
    if (droppedByLimit.length) {
      toast.error('You can upload up to 10 images only.');
    }

    if (accepted.length) {
      setImages((prev) => [...prev, ...accepted]);
    }

    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addComparison = () => {
    if (!comparisonDraft.platform || !comparisonDraft.price) return;
    setFormData((prev) => ({
      ...prev,
      price_comparisons: [
        ...prev.price_comparisons,
        {
          platform: comparisonDraft.platform.trim(),
          price: Number(comparisonDraft.price),
          url: comparisonDraft.url.trim()
        }
      ]
    }));
    setComparisonDraft({ platform: '', price: '', url: '' });
  };

  const removeComparison = (idx) => {
    setFormData((prev) => ({
      ...prev,
      price_comparisons: prev.price_comparisons.filter((_, i) => i !== idx)
    }));
  };

  // ── Address search above the map ───────────────────────────────────────────
  const searchAddressOnMap = async (query) => {
    const q = (query || addressSearch).trim();
    if (!q) {
      setError('Please type an address to search.');
      return;
    }
    setSearchLoading(true);
    setError('');
    setAddressSuggestion('');
    try {
      const coords = await geocodeAddress(q);
      if (!coords) {
        setError('Address not found. Try adding city or country for better results.');
        setSearchLoading(false);
        return;
      }
      const lat = parseFloat(coords.lat);
      const lng = parseFloat(coords.lng);
      if (isNaN(lat) || isNaN(lng)) {
        setError('Invalid coordinates returned for this address.');
        setSearchLoading(false);
        return;
      }
      // Reverse geocode to fill in city/country/formatted address
      try {
        const info = await reverseGeocode(lat, lng);
        if (info) {
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: info.address || prev.address,
            city: info.city || prev.city,
            country: info.country || prev.country
          }));
          setAddressSuggestion(info.address || q);
        } else {
          setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        }
      } catch {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
      }
      toast.success('📍 Location pinned on the map!');
    } catch (err) {
      setError(err.message || 'Address lookup failed. Try entering city + country.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced auto-search as user types (fires after 1.5s of inactivity)
  const handleAddressSearchChange = (e) => {
    const val = e.target.value;
    setAddressSearch(val);
    setAddressSuggestion('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length > 8) {
      debounceRef.current = setTimeout(() => {
        searchAddressOnMap(val);
      }, 1500);
    }
  };

  const handleAddressSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      searchAddressOnMap(addressSearch);
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ ...prev, latitude, longitude }));
        try {
          const info = await reverseGeocode(latitude, longitude);
          if (info) {
            setFormData(prev => ({
              ...prev,
              address: info.address || prev.address,
              city: info.city || prev.city,
              country: info.country || prev.country
            }));
            setAddressSearch(info.address || '');
            setAddressSuggestion(info.address || '');
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err);
        }
        setLocationLoading(false);
        toast.success('📍 Location detected!');
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationLoading(false);
        setError('Could not detect your location. Please allow location access or type an address.');
      }
    );
  };

  // Try to prefill location automatically on mount
  useEffect(() => {
    if (!formData.latitude && !formData.longitude) {
      useCurrentLocation();
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (images.length < 1) {
        setError('Please upload at least 1 image of your property.');
        setLoading(false);
        return;
      }
      if (!formData.latitude || !formData.longitude) {
        setError('Location is required. Search an address above or click on the map.');
        setLoading(false);
        return;
      }
      let finalComparisons = [...formData.price_comparisons];
      if (comparisonDraft.platform && comparisonDraft.price) {
        finalComparisons.push({
          platform: comparisonDraft.platform.trim(),
          price: Number(comparisonDraft.price),
          url: comparisonDraft.url.trim()
        });
      }
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'amenities') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === 'price_comparisons') {
          formDataToSend.append(key, JSON.stringify(finalComparisons));
        } else if (formData[key] !== '' && formData[key] != null) {
          formDataToSend.append(key, formData[key]);
        }
      });
      images.forEach(image => formDataToSend.append('images', image));
      await axios.post('/api/properties', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Property created successfully!');
      navigate('/host/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  const locationSet = formData.latitude && formData.longitude;

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-2xl)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Add New Property</h1>

        {error && (
          <div style={{
            padding: 'var(--spacing-md)',
            background: 'rgba(193, 53, 21, 0.1)',
            color: 'var(--error)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          {/* ── Basic Information ─────────────────────────────── */}
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Basic Information</h3>

          <div className="form-group">
            <label className="form-label">Property Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange}
              required className="form-input" placeholder="Beautiful apartment in downtown" />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange}
              className="form-textarea" placeholder="Describe your property..." />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select name="property_type" value={formData.property_type} onChange={handleChange} className="form-select">
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="cabin">Cabin</option>
                <option value="hotel">Hotel</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price per Night (₹)</label>
              <input type="number" name="price_per_night" value={formData.price_per_night}
                onChange={handleChange} required min="1" className="form-input" placeholder="100" />
            </div>
          </div>

          <div className="grid grid-3">
            <div className="form-group">
              <label className="form-label">Discount % (optional)</label>
              <input type="number" name="discount_percentage" value={formData.discount_percentage}
                onChange={handleChange} min="0" max="100" className="form-input" placeholder="10" />
            </div>
            <div className="form-group">
              <label className="form-label">Offer Title</label>
              <input type="text" name="offer_title" value={formData.offer_title}
                onChange={handleChange} className="form-input" placeholder="Festive Offer" />
            </div>
            <div className="form-group">
              <label className="form-label">Offer Valid Till</label>
              <input type="date" name="offer_valid_till" value={formData.offer_valid_till}
                onChange={handleChange} className="form-input" />
            </div>
          </div>

          {/* ── Price Comparison ──────────────────────────────── */}
          <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
            Price Comparison <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--neutral-400)' }}>(Optional)</span>
          </h3>
          <div className="grid grid-3">
            <input type="text" value={comparisonDraft.platform}
              onChange={(e) => setComparisonDraft(p => ({ ...p, platform: e.target.value }))}
              className="form-input" placeholder="Platform (e.g. Booking.com)" />
            <input type="number" value={comparisonDraft.price}
              onChange={(e) => setComparisonDraft(p => ({ ...p, price: e.target.value }))}
              className="form-input" placeholder="Price" />
            <input type="text" value={comparisonDraft.url}
              onChange={(e) => setComparisonDraft(p => ({ ...p, url: e.target.value }))}
              className="form-input" placeholder="Optional link" />
          </div>
          <button type="button" className="btn btn-secondary" onClick={addComparison}
            style={{ marginTop: 'var(--spacing-sm)' }}>
            + Add Comparison
          </button>
          {formData.price_comparisons.length > 0 && (
            <div style={{ marginTop: 'var(--spacing-md)', display: 'grid', gap: '0.5rem' }}>
              {formData.price_comparisons.map((c, idx) => (
                <div key={idx} className="card" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{c.platform}: ₹{c.price}</span>
                  <button type="button" className="btn btn-outline" onClick={() => removeComparison(idx)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {/* ── Capacity ──────────────────────────────────────── */}
          <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>Capacity</h3>
          <div className="grid grid-3">
            <div className="form-group">
              <label className="form-label">Bedrooms</label>
              <input type="number" name="bedrooms" value={formData.bedrooms}
                onChange={handleChange} required min="1" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Bathrooms</label>
              <input type="number" name="bathrooms" value={formData.bathrooms}
                onChange={handleChange} required min="1" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Max Guests</label>
              <input type="number" name="max_guests" value={formData.max_guests}
                onChange={handleChange} required min="1" className="form-input" />
            </div>
          </div>

          {/* ── Location ─────────────────────────────────────── */}
          <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-sm)' }}>Location</h3>
          <p style={{ color: 'var(--neutral-400)', marginBottom: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
            Search your property address below — the map will update automatically. You can also click the map to pin the exact spot.
          </p>

          {/* ── Address Search Bar (above map) ────────────────── */}
          <div style={{
            background: 'var(--neutral-50, #f8f9fa)',
            border: '2px solid var(--primary, #e91e8c)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-md)'
          }}>
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 'var(--spacing-sm)', display: 'block' }}>
              🔍 Search Address to Locate on Map
            </label>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '1.1rem', pointerEvents: 'none', zIndex: 1
                }}>📍</span>
                <input
                  type="text"
                  value={addressSearch}
                  onChange={handleAddressSearchChange}
                  onKeyDown={handleAddressSearchKeyDown}
                  className="form-input"
                  placeholder="e.g. Taj Mahal, Agra, India  or  Marine Drive, Mumbai"
                  style={{ paddingLeft: '2.5rem' }}
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={() => searchAddressOnMap(addressSearch)}
                className="btn btn-primary"
                disabled={searchLoading || !addressSearch.trim()}
                style={{ whiteSpace: 'nowrap', minWidth: '110px' }}
              >
                {searchLoading ? '⌛ Searching...' : '🗺️ Find on Map'}
              </button>
              <button
                type="button"
                onClick={useCurrentLocation}
                className="btn btn-secondary"
                disabled={locationLoading}
                style={{ whiteSpace: 'nowrap' }}
                title="Use my current GPS location"
              >
                {locationLoading ? '⌛...' : '📡 My Location'}
              </button>
            </div>
            {addressSuggestion && (
              <div style={{
                marginTop: 'var(--spacing-sm)', fontSize: '0.8rem',
                color: 'var(--success, #16a34a)', display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                <span>✅</span>
                <span>Pinned: <strong>{addressSuggestion}</strong></span>
              </div>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', marginTop: 'var(--spacing-xs)' }}>
              Press <kbd style={{ background: 'var(--neutral-200)', padding: '1px 5px', borderRadius: '3px' }}>Enter</kbd> or click "Find on Map" after typing. The map below will update instantly.
            </p>
          </div>

          {/* ── Map Preview ───────────────────────────────────── */}
          <div style={{
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: locationSet
              ? '2px solid var(--success, #16a34a)'
              : '2px dashed var(--neutral-300)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            <Map
              latitude={formData.latitude}
              longitude={formData.longitude}
              title={formData.title || 'New Listing'}
              interactive
              height={350}
              onLocationSelect={(newPos) => {
                setFormData(prev => ({ ...prev, latitude: newPos.lat, longitude: newPos.lng }));
                reverseGeocode(newPos.lat, newPos.lng).then(info => {
                  if (info) {
                    setFormData(prev => ({
                      ...prev,
                      address: info.address || prev.address,
                      city: info.city || prev.city,
                      country: info.country || prev.country
                    }));
                    setAddressSearch(info.address || '');
                    setAddressSuggestion(info.address || '');
                  }
                }).catch(() => {});
              }}
            />
          </div>

          {/* Coordinates display */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
            {locationSet ? (
              <>
                <span style={{ fontSize: '0.75rem', color: 'var(--success, #16a34a)', fontWeight: 600 }}>
                  ✅ Location set
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                  Lat: {Number(formData.latitude).toFixed(5)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                  Lng: {Number(formData.longitude).toFixed(5)}
                </span>
              </>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>
                ⚠️ No location set yet — search an address or click on the map
              </span>
            )}
          </div>

          {/* ── Address / City / Country fields ──────────────── */}
          <div className="form-group">
            <label className="form-label">Full Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange}
              className="form-input" placeholder="123 Main Street, Apt 4B" />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">City <span style={{ color: 'var(--error)' }}>*</span></label>
              <input type="text" name="city" value={formData.city} onChange={handleChange}
                required className="form-input" placeholder="Mumbai" />
            </div>
            <div className="form-group">
              <label className="form-label">Country <span style={{ color: 'var(--error)' }}>*</span></label>
              <input type="text" name="country" value={formData.country} onChange={handleChange}
                required className="form-input" placeholder="India" />
            </div>
          </div>

          {/* ── Amenities ─────────────────────────────────────── */}
          <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>Amenities</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
            {amenitiesList.map(amenity => (
              <label key={amenity} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.amenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)} style={{ width: '18px', height: '18px' }} />
                <span>{amenity}</span>
              </label>
            ))}
          </div>

          {/* ── Images ───────────────────────────────────────── */}
          <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
            Images <span style={{ color: 'var(--error)', fontSize: '0.9rem' }}>(At least 1 required, up to 10)</span>
          </h3>
          <div className="form-group">
            <label className="form-label">Upload Images (Max 10)</label>
            <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={handleImageChange} className="form-input" />
            {images.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: 'var(--spacing-md)',
                marginTop: 'var(--spacing-lg)'
              }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', height: '100px' }}>
                    <img src={URL.createObjectURL(img)} alt={`preview ${idx}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    <button type="button" onClick={() => removeImage(idx)} style={{
                      position: 'absolute', top: '-8px', right: '-8px',
                      background: 'var(--error)', color: 'white', border: 'none', borderRadius: '50%',
                      width: '24px', height: '24px', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p style={{ marginTop: 'var(--spacing-sm)', color: 'var(--neutral-400)', fontSize: '0.875rem' }}>
              {images.length} image(s) selected. You can add more by selecting files again.
            </p>
          </div>

          {/* ── Submit ────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Property'}
            </button>
            <button type="button" onClick={() => navigate('/host/dashboard')} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProperty;
