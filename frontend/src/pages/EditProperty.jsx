import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Map from '../components/Map';
import { reverseGeocode, geocodeAddress } from '../utils/googleMaps';

function EditProperty() {
  const { id } = useParams();
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
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [comparisonDraft, setComparisonDraft] = useState({ platform: '', price: '', url: '' });


  const amenitiesList = [
    'WiFi', 'Kitchen', 'Parking', 'Air Conditioning', 'Heating',
    'TV', 'Washer', 'Dryer', 'Pool', 'Gym', 'Hot Tub', 'Workspace'
  ];

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get(`/api/properties/${id}`);
      const data = response.data;
      
      setFormData({
        title: data.title,
        description: data.description || '',
        property_type: data.property_type,
        price_per_night: data.price_per_night,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        max_guests: data.max_guests,
        address: data.address || '',
        city: data.city,
        country: data.country,
        latitude: (data.latitude !== undefined && data.latitude !== null) ? data.latitude : '',
        longitude: (data.longitude !== undefined && data.longitude !== null) ? data.longitude : '',
        discount_percentage: data.discount_percentage || '',
        offer_title: data.offer_title || '',
        offer_valid_till: data.offer_valid_till ? new Date(data.offer_valid_till).toISOString().split('T')[0] : '',
        price_comparisons: Array.isArray(data.price_comparisons) ? data.price_comparisons : [],
        amenities: Array.isArray(data.amenities) ? data.amenities : (typeof data.amenities === 'string' ? JSON.parse(data.amenities) : []),
      });
      
      setExistingImages(Array.isArray(data.images) ? data.images : (typeof data.images === 'string' ? JSON.parse(data.images) : []));
    } catch (err) {
      console.error(err);
      setError('Failed to load property data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
    setNewImages(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageName) => {
    if (confirm('Are you sure you want to remove this image? This will be saved only when you click Update.')) {
      setExistingImages(prev => prev.filter(img => img !== imageName));
    }
  };

  const addComparison = () => {
    if (!comparisonDraft.platform || !comparisonDraft.price) return;
    setFormData((prev) => ({
      ...prev,
      price_comparisons: [
        ...prev.price_comparisons,
        { platform: comparisonDraft.platform.trim(), price: Number(comparisonDraft.price), url: comparisonDraft.url.trim() }
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



  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));

        try {
          const locationInfo = await reverseGeocode(latitude, longitude);
          if (locationInfo) {
            setFormData(prev => ({
              ...prev,
              address: locationInfo.address || prev.address,
              city: locationInfo.city || prev.city,
              country: locationInfo.country || prev.country
            }));
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          setError('Location pinned; address autofill failed. Enter address/city/country manually.');
        }
        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationLoading(false);
        setError('Could not detect your location. Allow location permission in browser settings.');
      }
    );
  };

  const geocodeAddressToCoordinates = async ({ fromBlur = false } = {}) => {
    const query = `${formData.address || ''} ${formData.city || ''} ${formData.country || ''}`.trim();
    if (!query) {
      if (!fromBlur) setError('Please enter an address (or city/country) first.');
      return;
    }
    if (fromBlur && query.length < 12) return;

    setLocationLoading(true);
    setError('');
    try {
      const coords = await geocodeAddress(query);
      if (!coords) {
        setError('Could not find this address. Add city/country and try again.');
        setLocationLoading(false);
        return;
      }
      const plat = parseFloat(coords.lat);
      const plng = parseFloat(coords.lng);
      if (Number.isNaN(plat) || Number.isNaN(plng)) {
        setError('Invalid coordinates returned for this address.');
        setLocationLoading(false);
        return;
      }
      setFormData((prev) => ({
        ...prev,
        latitude: plat,
        longitude: plng
      }));
      toast.success('Location found — check the map below.');
    } catch (err) {
      console.error('Address geocoding failed:', err);
      if (!fromBlur) {
        setError(err.message || 'Address lookup failed. You can still click the map to pin the location.');
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const totalImages = existingImages.length + newImages.length;
      if (totalImages < 5) {
        setError('At least 5 images are required for your property listing.');
        setSaving(false);
        return;
      }
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'amenities') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === 'price_comparisons') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== '' && formData[key] != null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Special handling for images: 
      // We pass the final list of existing images as a field
      formDataToSend.append('existingImages', JSON.stringify(existingImages));

      // Append new images
      newImages.forEach(image => {
        formDataToSend.append('images', image);
      });

      await axios.put(`/api/properties/${id}`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/host/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-2xl)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Edit Property</h1>

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
          <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Basic Information</h3>

          <div className="form-group">
            <label className="form-label">Property Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                className="form-select"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="cabin">Cabin</option>
                <option value="hotel">Hotel</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Price per Night (₹)</label>
              <input
                type="number"
                name="price_per_night"
                value={formData.price_per_night}
                onChange={handleChange}
                required
                min="1"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-3">
            <div className="form-group">
              <label className="form-label">Discount %</label>
              <input
                type="number"
                name="discount_percentage"
                value={formData.discount_percentage}
                onChange={handleChange}
                min="0"
                max="100"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Offer title</label>
              <input
                type="text"
                name="offer_title"
                value={formData.offer_title}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Offer valid till</label>
              <input
                type="date"
                name="offer_valid_till"
                value={formData.offer_valid_till}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>Price Comparison (Optional)</h3>
          <div className="grid grid-3">
            <input
              type="text"
              value={comparisonDraft.platform}
              onChange={(e) => setComparisonDraft((p) => ({ ...p, platform: e.target.value }))}
              className="form-input"
              placeholder="Platform"
            />
            <input
              type="number"
              value={comparisonDraft.price}
              onChange={(e) => setComparisonDraft((p) => ({ ...p, price: e.target.value }))}
              className="form-input"
              placeholder="Price"
            />
            <input
              type="text"
              value={comparisonDraft.url}
              onChange={(e) => setComparisonDraft((p) => ({ ...p, url: e.target.value }))}
              className="form-input"
              placeholder="Optional link"
            />
          </div>
          <button type="button" className="btn btn-secondary" onClick={addComparison} style={{ marginTop: 'var(--spacing-sm)' }}>
            + Add comparison
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

          <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>Location</h3>
          <div className="form-group">
            <label className="form-label">Address</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter property address..."
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                onClick={useCurrentLocation}
                className="btn btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
                disabled={locationLoading}
              >
                {locationLoading ? '⌛ Locating...' : '📍 Use My Location'}
              </button>
              <button
                type="button"
                onClick={() => geocodeAddressToCoordinates()}
                className="btn btn-outline"
                style={{ whiteSpace: 'nowrap' }}
                disabled={locationLoading}
              >
                Find on map
              </button>
            </div>

            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <p style={{ color: 'var(--neutral-400)', marginBottom: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
                You can also click on the map to set the exact location:
              </p>
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--neutral-200)' }}>
                <Map 
                  latitude={formData.latitude} 
                  longitude={formData.longitude} 
                  title={formData.title || 'Listing'}
                  interactive
                  height={300}
                  onLocationSelect={(newPos) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: newPos.lat,
                      longitude: newPos.lng
                    }));
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>Lat: {formData.latitude || 'Not set'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>Lng: {formData.longitude || 'Not set'}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                onBlur={() => geocodeAddressToCoordinates({ fromBlur: true })}
                required
                className="form-input"
              />
            </div>
          </div>

          <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>Amenities</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)' }}>
            {amenitiesList.map(amenity => (
              <label key={amenity} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                />
                <span>{amenity}</span>
              </label>
            ))}
          </div>

          <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>Images <span style={{ color: 'var(--error)', fontSize: '0.9rem' }}>(Minimum 5 required)</span></h3>
          
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label className="form-label">Current Images</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                gap: 'var(--spacing-md)' 
              }}>
                {existingImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', height: '100px' }}>
                    <img 
                      src={`/uploads/${img}`} 
                      alt={`current ${idx}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img)}
                      style={{
                        position: 'absolute', top: '-8px', right: '-8px',
                        background: 'var(--error)', color: 'white', border: 'none',
                        borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer'
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images */}
          <div className="form-group">
            <label className="form-label">Add New Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="form-input"
            />
            {newImages.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                gap: 'var(--spacing-md)',
                marginTop: 'var(--spacing-md)'
              }}>
                {newImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', height: '100px' }}>
                    <img 
                      src={URL.createObjectURL(img)} 
                      alt={`new preview ${idx}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      style={{
                        position: 'absolute', top: '-8px', right: '-8px',
                        background: 'var(--error)', color: 'white', border: 'none',
                        borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer'
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Updating...' : 'Update Property'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/host/dashboard')} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProperty;
