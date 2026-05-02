import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { resolveAssetUrl } from '../utils/api';
import axios from 'axios';
import toast from 'react-hot-toast';

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

const PropertyCard = ({ property, initialFavourited = false, onUnfavourite }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [favourited, setFavourited] = useState(initialFavourited);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setFavourited(initialFavourited);
  }, [initialFavourited]);

  const images = parseImages(property?.images);
  const getImageUrl = (img) => {
    if (!img) return 'https://via.placeholder.com/400x400?text=No+Image';
    return resolveAssetUrl(img);
  };

  const discountPercent = Number(property?.discount_percentage || 0);
  const hasOffer = Boolean(property?.offer_title) || discountPercent > 0;
  const discountedPricePerNight =
    discountPercent > 0
      ? Math.max(0, Math.round((Number(property?.price_per_night || 0) * (100 - discountPercent)) / 100))
      : Number(property?.price_per_night || 0);

  const rating = property.avg_rating ? parseFloat(property.avg_rating).toFixed(2) : 'New';
  const firstImage = images.length > 0 ? getImageUrl(images[0]) : 'https://via.placeholder.com/400x400?text=No+Image';

  const handleHeartClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to save favourites');
      return;
    }

    if (toggling) return;
    setToggling(true);

    // Optimistic update
    const newState = !favourited;
    setFavourited(newState);

    try {
      const res = await axios.post(`/api/favourites/${property.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavourited(res.data.favourited);

      if (!res.data.favourited) {
        toast('Removed from Favourites', { icon: '💔' });
        onUnfavourite?.(property.id); // notify parent (Favourites page)
      } else {
        toast.success('Added to Favourites ❤️');
      }
    } catch {
      // Rollback on error
      setFavourited(!newState);
      toast.error('Could not update favourites');
    } finally {
      setToggling(false);
    }
  }, [favourited, toggling, property.id, onUnfavourite]);

  return (
    <div 
      style={{ position: 'relative', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/property/${property.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        
        {/* Image Box */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--neutral-100)' }}>
          <img 
            src={firstImage} 
            alt={property.title}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transition: 'transform 0.4s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
            }}
          />

          {hasOffer && (
            <div
              style={{
                position: 'absolute',
                left: '12px',
                bottom: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                zIndex: 5
              }}
            >
              {property.offer_title && (
                <span
                  style={{
                    background: 'rgba(0,0,0,0.72)',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    maxWidth: '260px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={property.offer_title}
                >
                  {property.offer_title}
                </span>
              )}
              {discountPercent > 0 && (
                <span
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    width: 'fit-content'
                  }}
                >
                  {discountPercent}% OFF
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content Box */}
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--neutral-600)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
              {property.city}, {property.country}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', color: 'var(--neutral-600)' }}>
              <Star size={14} fill="var(--neutral-600)" />
              <span>{rating}</span>
            </div>
          </div>
          
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--neutral-400)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {property.title}
          </p>
          
          <p style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--neutral-400)' }}>
            {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''} · {property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}
          </p>
          
          <div style={{ marginTop: '0.25rem', fontSize: '1rem', color: 'var(--neutral-600)' }}>
            {discountPercent > 0 ? (
              <>
                <span style={{ fontWeight: 700 }}>₹{discountedPricePerNight}</span>{' '}
                <span style={{ fontWeight: 400, color: 'var(--neutral-400)', textDecoration: 'line-through', marginLeft: '0.35rem' }}>
                  ₹{property.price_per_night}
                </span>{' '}
                <span style={{ fontWeight: 400 }}>/ night</span>
              </>
            ) : (
              <>
                <span style={{ fontWeight: 600 }}>₹{property.price_per_night}</span> <span style={{ fontWeight: 400 }}>/ night</span>
              </>
            )}
          </div>
        </div>
      </Link>
      
      {/* Heart Button — toggles favourite */}
      <button 
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'transparent',
          border: 'none',
          cursor: toggling ? 'wait' : 'pointer',
          zIndex: 10,
          padding: '4px',
          transition: 'transform 0.15s ease',
          transform: toggling ? 'scale(0.85)' : 'scale(1)'
        }}
        onClick={handleHeartClick}
        aria-label={favourited ? 'Remove from favourites' : 'Add to favourites'}
        title={favourited ? 'Remove from favourites' : 'Add to favourites'}
      >
        <Heart
          size={24}
          color={favourited ? '#FF385C' : 'white'}
          fill={favourited ? '#FF385C' : 'rgba(0,0,0,0.45)'}
          strokeWidth={favourited ? 0 : 1.5}
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))', transition: 'all 0.2s ease' }}
        />
      </button>

    </div>
  );
};

export default PropertyCard;
