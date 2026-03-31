import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let authFailedGlobal = false;
window.gm_authFailure = () => {
  authFailedGlobal = true;
  window.dispatchEvent(new Event('gm_authFailure'));
};

// Load Google Maps script once
let googleMapsPromise = null;
function loadGoogleMaps() {
  if (googleMapsPromise) return googleMapsPromise;
  if (window.google && window.google.maps) {
    googleMapsPromise = Promise.resolve(window.google.maps);
    return googleMapsPromise;
  }
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Missing Google Maps API key. Set VITE_GOOGLE_MAPS_API_KEY in your frontend .env file.');
    return Promise.reject(new Error('Google Maps API key missing'));
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

const Map = ({ latitude, longitude, title, interactive = false, onLocationSelect }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [authError, setAuthError] = useState(authFailedGlobal);

  const isValidCoords = (latitude !== undefined && latitude !== null && latitude !== '') &&
                        (longitude !== undefined && longitude !== null && longitude !== '');

  const lat = isValidCoords ? parseFloat(latitude) : null;
  const lng = isValidCoords ? parseFloat(longitude) : null;
  const validParsed = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

  // Listen for Google Maps auth failures globally
  useEffect(() => {
    const handleAuthFail = () => setAuthError(true);
    window.addEventListener('gm_authFailure', handleAuthFail);
    return () => window.removeEventListener('gm_authFailure', handleAuthFail);
  }, []);

  // Stable callback ref so the map event listener always sees the latest fn
  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => { onLocationSelectRef.current = onLocationSelect; }, [onLocationSelect]);

  // Initialize map
  useEffect(() => {
    if (!validParsed || authError) return;
    let cancelled = false;

    loadGoogleMaps().then((maps) => {
      if (cancelled || !mapContainerRef.current || authFailedGlobal) return;

      const center = { lat, lng };

      // Create map only once
      if (!mapRef.current) {
        mapRef.current = new maps.Map(mapContainerRef.current, {
          center,
          zoom: interactive ? 13 : 15,
          disableDefaultUI: false,
          gestureHandling: 'greedy',
        });

        // Click to select location in interactive mode
        if (interactive) {
          mapRef.current.addListener('click', (e) => {
            if (onLocationSelectRef.current) {
              onLocationSelectRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            }
          });
        }
      }

      // Create / update marker
      if (!markerRef.current) {
        markerRef.current = new maps.Marker({
          position: center,
          map: mapRef.current,
          title: title || 'Property Location',
          draggable: interactive,
        });

        if (interactive) {
          markerRef.current.addListener('dragend', () => {
            const pos = markerRef.current.getPosition();
            if (onLocationSelectRef.current) {
              onLocationSelectRef.current({ lat: pos.lat(), lng: pos.lng() });
            }
          });
        }
      } else {
        markerRef.current.setPosition(center);
      }

      mapRef.current.panTo(center);
    }).catch((err) => {
      console.error('Failed to load Google Maps:', err);
    });

    return () => { cancelled = true; };
  }, [lat, lng, validParsed, interactive, title, authError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current = null;
    };
  }, []);

  if (authError) {
    return (
      <div style={{
        width: '100%', height: '400px', background: 'var(--neutral-100)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius-lg)', color: 'var(--neutral-500)', border: '1px dashed var(--neutral-300)',
        padding: 'var(--spacing-lg)', textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>🗺️</div>
        <div style={{ fontWeight: '600', color: 'var(--error)' }}>Map unavailable</div>
        <div style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-xs)', color: 'var(--neutral-600)' }}>
          The provided Google Maps API Key is invalid or missing billing details.
        </div>
      </div>
    );
  }

  if (!validParsed) {
    return (
      <div style={{
        width: '100%', height: '400px', background: 'var(--neutral-100)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius-lg)', color: 'var(--neutral-500)', border: '1px dashed var(--neutral-300)',
        padding: 'var(--spacing-lg)', textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>📍</div>
        <div>No location coordinates available for this property.</div>
        <div style={{ fontSize: '0.8rem', marginTop: 'var(--spacing-xs)' }}>
          Edit this property to select a location on the map.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
      }}
    />
  );
};

export default Map;
