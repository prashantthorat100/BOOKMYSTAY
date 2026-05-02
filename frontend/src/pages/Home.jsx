import { useState, useEffect } from 'react';
import axios from 'axios';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';

function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favouriteIds, setFavouriteIds] = useState(new Set());

  // Fetch favourite IDs for the logged-in user (silent – no error shown if not logged in)
  const fetchFavouriteIds = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get('/api/favourites/ids', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavouriteIds(new Set(res.data));
    } catch {
      // not critical – hearts just default to un-filled
    }
  };

  const fetchProperties = async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const response = await axios.get(`/api/properties?${params.toString()}`);
      setProperties(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load properties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchFavouriteIds();
  }, []);

  // Re-fetch favourite IDs when user logs in/out
  useEffect(() => {
    window.addEventListener('auth-change', fetchFavouriteIds);
    return () => window.removeEventListener('auth-change', fetchFavouriteIds);
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div className="hero">
        <div className="container">
          <h1>Find Your Perfect Stay</h1>
          <p>Discover amazing places to stay around the world</p>
        </div>
      </div>

      {/* Search and Results */}
      <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
        <SearchBar onSearch={fetchProperties} />

        {loading ? (
          <div className="spinner"></div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'var(--error)', padding: 'var(--spacing-xl)' }}>
            {error}
          </div>
        ) : properties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <h3>No properties found</h3>
            <p>Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>
              {properties.length} Properties Available
            </h2>
            <div className="grid grid-4">
              {properties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  initialFavourited={favouriteIds.has(String(property.id))}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
