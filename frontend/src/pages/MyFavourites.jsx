import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PropertyCard from '../components/PropertyCard';
import { Heart } from 'lucide-react';

function MyFavourites() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavourites = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.get('/api/favourites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProperties(res.data);
    } catch (err) {
      console.error('Failed to load favourites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, []);

  // Remove a property from the local list when the heart is toggled off
  const handleUnfavourite = (propertyId) => {
    setProperties(prev => prev.filter(p => String(p.id) !== String(propertyId)));
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)', minHeight: '60vh' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 'var(--spacing-xl)' }}>
        <Heart size={28} color="#FF385C" fill="#FF385C" />
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>My Favourites</h1>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : properties.length === 0 ? (
        /* Empty state */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '5rem 1rem', textAlign: 'center', gap: '1rem'
        }}>
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%',
            background: 'rgba(255,56,92,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <Heart size={44} color="#FF385C" fill="rgba(255,56,92,0.15)" />
          </div>
          <h2 style={{ margin: 0, color: 'var(--neutral-600)' }}>No favourites yet</h2>
          <p style={{ margin: 0, color: 'var(--neutral-400)', maxWidth: '340px', lineHeight: 1.6 }}>
            Tap the ❤️ on any property to save it here. Your wishlist will appear here.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '1rem', padding: '0.75rem 2rem' }}
            onClick={() => navigate('/')}
          >
            Explore Properties
          </button>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--neutral-400)', marginBottom: 'var(--spacing-lg)', fontSize: '0.95rem' }}>
            {properties.length} saved propert{properties.length === 1 ? 'y' : 'ies'}
          </p>
          <div className="grid grid-4">
            {properties.map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                initialFavourited={true}
                onUnfavourite={handleUnfavourite}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default MyFavourites;
