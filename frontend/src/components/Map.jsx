import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, hasGoogleMapsAuthFailed } from '../utils/googleMaps';

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

/**
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @param {string} [title]
 * @param {boolean} [interactive] — click / drag to set location
 * @param {(pos: { lat: number, lng: number }) => void} [onLocationSelect]
 * @param {number|string} [height] — CSS px height for the map container
 */
const Map = ({
  latitude,
  longitude,
  title,
  interactive = false,
  onLocationSelect,
  height = 400
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const lastCenterRef = useRef({ lat: null, lng: null });
  const [authError, setAuthError] = useState(hasGoogleMapsAuthFailed());
  const [mapError, setMapError] = useState('');
  const [mapLoadAttempt, setMapLoadAttempt] = useState(0);

  const isValidCoords =
    latitude !== undefined &&
    latitude !== null &&
    latitude !== '' &&
    longitude !== undefined &&
    longitude !== null &&
    longitude !== '';

  const lat = isValidCoords ? parseFloat(latitude) : null;
  const lng = isValidCoords ? parseFloat(longitude) : null;
  const validParsed = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  const titleRef = useRef(title);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    const handleAuthFail = () => setAuthError(true);
    window.addEventListener('gm_authFailure', handleAuthFail);
    return () => window.removeEventListener('gm_authFailure', handleAuthFail);
  }, []);

  const heightPx = typeof height === 'number' ? `${height}px` : height;

  useEffect(() => {
    if (authError) return;

    let cancelled = false;

    loadGoogleMaps(['marker'])
      .then((maps) => {
        if (cancelled || !mapContainerRef.current || hasGoogleMapsAuthFailed()) return;

        setMapError('');

        const center = validParsed ? { lat, lng } : DEFAULT_CENTER;

        const centerMoved =
          validParsed &&
          (lastCenterRef.current.lat == null ||
            lastCenterRef.current.lng == null ||
            Math.abs(lastCenterRef.current.lat - lat) > 1e-6 ||
            Math.abs(lastCenterRef.current.lng - lng) > 1e-6);

        if (!mapRef.current) {
          mapRef.current = new maps.Map(mapContainerRef.current, {
            center,
            zoom: validParsed ? (interactive ? 15 : 15) : 5,
            disableDefaultUI: false,
            mapTypeControl: true,
            streetViewControl: interactive,
            fullscreenControl: true,
            gestureHandling: 'greedy'
          });

          if (interactive) {
            mapRef.current.addListener('click', (e) => {
              const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
              if (!markerRef.current) {
                markerRef.current = new maps.Marker({
                  position: pos,
                  map: mapRef.current,
                  title: titleRef.current || 'Property Location',
                  draggable: true
                });
                markerRef.current.addListener('dragend', () => {
                  const p = markerRef.current.getPosition();
                  onLocationSelectRef.current?.({ lat: p.lat(), lng: p.lng() });
                });
              } else {
                markerRef.current.setPosition(pos);
              }
              onLocationSelectRef.current?.(pos);
            });
          }
          lastCenterRef.current = validParsed ? { lat, lng } : { lat: null, lng: null };
        } else if (validParsed) {
          mapRef.current.panTo(center);
          if (centerMoved) {
            mapRef.current.setZoom(15);
          }
          lastCenterRef.current = { lat, lng };
        } else {
          lastCenterRef.current = { lat: null, lng: null };
          mapRef.current.panTo(DEFAULT_CENTER);
          mapRef.current.setZoom(5);
        }

        if (!interactive && validParsed) {
          if (!markerRef.current) {
            markerRef.current = new maps.Marker({
              position: center,
              map: mapRef.current,
              title: title || 'Property Location',
              draggable: false
            });
          } else {
            markerRef.current.setPosition(center);
            markerRef.current.setMap(mapRef.current);
            markerRef.current.setDraggable(false);
          }
        } else if (interactive && validParsed) {
          if (!markerRef.current) {
            markerRef.current = new maps.Marker({
              position: center,
              map: mapRef.current,
              title: title || 'Property Location',
              draggable: true
            });
            markerRef.current.addListener('dragend', () => {
              const p = markerRef.current.getPosition();
              onLocationSelectRef.current?.({ lat: p.lat(), lng: p.lng() });
            });
          } else {
            markerRef.current.setPosition(center);
            markerRef.current.setMap(mapRef.current);
            markerRef.current.setDraggable(true);
          }
        } else if (markerRef.current && !validParsed) {
          markerRef.current.setMap(null);
          markerRef.current = null;
        }

        if (markerRef.current && (title || titleRef.current)) {
          markerRef.current.setTitle(title || titleRef.current || 'Property Location');
        }

        if (mapRef.current && window.google?.maps?.event) {
          window.google.maps.event.trigger(mapRef.current, 'resize');
        }
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setMapError(err.message || 'Google Maps failed to load. Check API key, billing, and referrer restrictions.');
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, validParsed, interactive, title, authError, mapLoadAttempt]);

  useEffect(() => {
    if (authError) return;
    const el = mapContainerRef.current;
    if (!el || !window.google?.maps?.event) return;

    const ro = new ResizeObserver(() => {
      if (mapRef.current) {
        window.google.maps.event.trigger(mapRef.current, 'resize');
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [authError, heightPx, lat, lng, validParsed, mapLoadAttempt]);

  const showErrorOverlay = authError || Boolean(mapError);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: heightPx,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)'
      }}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {showErrorOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--neutral-100)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--neutral-500)',
            border: '1px dashed var(--neutral-300)',
            padding: 'var(--spacing-lg)',
            textAlign: 'center',
            zIndex: 2
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>🗺️</div>
          <div style={{ fontWeight: 600, color: 'var(--error)' }}>Map unavailable</div>
          <div style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-xs)' }}>
            {mapError || 'Google Maps authorization failed for this key.'}
          </div>
          {!authError && mapError && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: 'var(--spacing-md)' }}
              onClick={() => {
                setMapError('');
                setMapLoadAttempt((a) => a + 1);
              }}
            >
              Retry loading map
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Map;
