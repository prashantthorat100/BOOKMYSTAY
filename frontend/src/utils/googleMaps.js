const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/** Libraries loaded on the Maps JS script. */
const DEFAULT_MAP_LIBRARIES = ['marker'];

let authFailedGlobal = false;

const origGmAuthFailure = window.gm_authFailure;
window.gm_authFailure = () => {
  authFailedGlobal = true;
  window.dispatchEvent(new Event('gm_authFailure'));
  origGmAuthFailure?.();
};

let googleMapsPromise = null;

export const hasGoogleMapsKey = () => Boolean(GOOGLE_MAPS_API_KEY);

export const hasGoogleMapsAuthFailed = () => authFailedGlobal;

// ─────────────────────────────────────────────────────────────────────────────
// FREE Geocoding via OpenStreetMap Nominatim (no billing, no extra API key)
// Google Maps JavaScript API (the visual map) is kept as-is.
// ─────────────────────────────────────────────────────────────────────────────

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const NOMINATIM_HEADERS = {
  // Nominatim requires a User-Agent identifying your app
  'Accept-Language': 'en',
  'User-Agent': 'BookMyStay/1.0 (contact@bookmystay.com)'
};

/**
 * Forward geocoding — converts an address string → { lat, lng }
 * Uses OpenStreetMap Nominatim (free, no API key needed).
 */
export const geocodeAddress = async (query) => {
  const cleaned = (query || '').trim();
  if (!cleaned) return null;

  const url =
    `${NOMINATIM_BASE}/search?format=jsonv2&limit=1&q=${encodeURIComponent(cleaned)}`;

  const response = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!response.ok) {
    throw new Error(`Nominatim search failed (HTTP ${response.status}). Check your internet connection.`);
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) return null;

  const first = results[0];
  return {
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon)
  };
};

/**
 * Reverse geocoding — converts { lat, lng } → { address, city, country }
 * Uses OpenStreetMap Nominatim (free, no API key needed).
 */
export const reverseGeocode = async (lat, lng) => {
  const url =
    `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;

  const response = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!response.ok) {
    throw new Error(`Nominatim reverse geocode failed (HTTP ${response.status}).`);
  }

  const data = await response.json();
  if (!data || data.error) return null;

  const addr = data.address || {};
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.county ||
    addr.state_district ||
    '';
  const country = addr.country || '';
  const formattedAddress = data.display_name || '';

  return {
    address: formattedAddress,
    city,
    country
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Google Maps JavaScript API loader (for the visual map — still uses your key)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads the Maps JavaScript API once.
 * Only the map rendering uses the Google key; geocoding is now via Nominatim.
 */
export const loadGoogleMaps = (libraries = []) => {
  if (window.google?.maps) {
    if (!googleMapsPromise) {
      googleMapsPromise = Promise.resolve(window.google.maps);
    }
    return googleMapsPromise;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error('Google Maps API key missing. Set VITE_GOOGLE_MAPS_API_KEY in frontend/.env')
    );
  }

  if (googleMapsPromise) return googleMapsPromise;

  const libSet = new Set([...DEFAULT_MAP_LIBRARIES, ...libraries]);
  const libsParam = [...libSet].sort().join(',');

  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=${encodeURIComponent(libsParam)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        googleMapsPromise = null;
        reject(new Error('Google Maps script loaded but `google.maps` is missing.'));
      }
    };
    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error('Failed to load Google Maps (network error or blocked script).'));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};
