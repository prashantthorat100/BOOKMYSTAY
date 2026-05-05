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
      style={{
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #E8E8E8',
        boxShadow: isHovered
          ? '0 8px 30px rgba(0,0,0,0.13)'
          : '0 2px 8px rgba(0,0,0,0.07)',
        transition: 'box-shadow 0.28s ease, transform 0.28s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/property/${property.id}`}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >

        {/* ── Image Poster — fixed height, same for every card ── */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '220px',          /* fixed height = same image size on all cards */
          flexShrink: 0,
          overflow: 'hidden',
          background: 'var(--neutral-100)',
        }}>
          <img
            src={firstImage}
            alt={property.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.4s ease',
              transform: isHovered ? 'scale(1.06)' : 'scale(1)',
            }}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x220?text=No+Image';
            }}
          />

          {/* Offer / Discount badges */}
          {hasOffer && (
            <div
              style={{
                position: 'absolute',
                left: '12px',
                bottom: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                zIndex: 5,
              }}
            >
              {property.offer_title && (
                <span
                  style={{
                    background: 'rgba(0,0,0,0.72)',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    maxWidth: '240px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
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
                    padding: '5px 10px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    width: 'fit-content',
                  }}
                >
                  {discountPercent}% OFF
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Thin divider between image and content ── */}
        <div style={{ height: '1px', background: '#F0F0F0', flexShrink: 0 }} />

        {/* ── Content Area ── */}
        <div style={{
          padding: '14px 16px 16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '4px',
        }}>

          {/* Top: location + rating */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{
              fontSize: '0.97rem',
              fontWeight: 700,
              color: '#222',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '80%',
              letterSpacing: '-0.01em',
            }}>
              {property.city}, {property.country}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.85rem',
              color: '#222',
              fontWeight: 600,
              flexShrink: 0,
            }}>
              <Star size={13} fill="#222" color="#222" />
              <span>{rating}</span>
            </div>
          </div>

          {/* Property title */}
          <p style={{
            margin: 0,
            fontSize: '0.85rem',
            color: '#717171',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}>
            {property.title}
          </p>

          {/* Beds / baths */}
          <p style={{
            margin: 0,
            fontSize: '0.83rem',
            color: '#717171',
          }}>
            {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}&nbsp;·&nbsp;{property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}
          </p>

          {/* Price — pinned at bottom */}
          <div style={{
            marginTop: '6px',
            paddingTop: '10px',
            borderTop: '1px solid #F0F0F0',
            fontSize: '0.97rem',
            color: '#222',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
          }}>
            {discountPercent > 0 ? (
              <>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem' }}>
                  ₹{discountedPricePerNight}
                </span>
                <span style={{ fontWeight: 400, color: '#aaa', textDecoration: 'line-through', fontSize: '0.88rem' }}>
                  ₹{property.price_per_night}
                </span>
                <span style={{ fontWeight: 400, color: '#717171', fontSize: '0.88rem' }}>/ night</span>
              </>
            ) : (
              <>
                <span style={{ fontWeight: 700 }}>₹{property.price_per_night}</span>
                <span style={{ fontWeight: 400, color: '#717171', fontSize: '0.88rem' }}>/ night</span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* ── Heart / Favourite button ── */}
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
          transform: toggling ? 'scale(0.85)' : 'scale(1)',
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
          style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))', transition: 'all 0.2s ease' }}
        />
      </button>
    </div>
  );
};

export default PropertyCard;
