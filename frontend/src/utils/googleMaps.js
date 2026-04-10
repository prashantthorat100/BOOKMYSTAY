const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/** Libraries loaded on the Maps JS script (`places` requires Places API enabled — add when using Autocomplete). */
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

/** Human-readable hint for Geocoding REST `status` values. */
export const geocodeStatusMessage = (status, errorMessage) => {
  const hints = {
    REQUEST_DENIED:
      'Geocoding was denied. Enable Geocoding API and Maps JavaScript API, turn on billing, and allow this site’s URL under Application restrictions.',
    OVER_QUERY_LIMIT: 'Geocoding quota exceeded. Try again later or check Google Cloud quotas.',
    INVALID_REQUEST: 'Invalid address request. Refine address, city, or country.',
    UNKNOWN_ERROR: 'Google Geocoding temporarily failed. Retry in a moment.'
  };
  if (status === 'ZERO_RESULTS') return null;
  return hints[status] || errorMessage || status || 'Geocoding failed.';
};

const ensureGeocodeOkForResults = (data) => {
  if (!data) throw new Error('No response from Geocoding API.');
  if (data.status === 'OK' || data.status === 'ZERO_RESULTS') return;
  const msg = geocodeStatusMessage(data.status, data.error_message);
  throw new Error(msg || data.status);
};

/**
 * Loads the Maps JavaScript API once. Extra `libraries` are merged into the script URL.
 * Resets internal state if the script fails to load so the next call can retry.
 */
export const loadGoogleMaps = (libraries = []) => {
  if (window.google?.maps) {
    if (!googleMapsPromise) {
      googleMapsPromise = Promise.resolve(window.google.maps);
    }
    return googleMapsPromise;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('Google Maps API key missing (set VITE_GOOGLE_MAPS_API_KEY).'));
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
      reject(new Error('Failed to load Google Maps JavaScript API (network or blocked script).'));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const reverseGeocode = async (lat, lng) => {
  if (!GOOGLE_MAPS_API_KEY) throw new Error('Google Maps API key missing');
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`
  );
  const data = await response.json();
  ensureGeocodeOkForResults(data);
  const first = data?.results?.[0];
  if (!first) return null;
  const components = first.address_components || [];
  const city =
    components.find((c) => c.types.includes('locality'))?.long_name ||
    components.find((c) => c.types.includes('administrative_area_level_2'))?.long_name ||
    '';
  const country = components.find((c) => c.types.includes('country'))?.long_name || '';

  return {
    address: first.formatted_address || '',
    city,
    country
  };
};

export const geocodeAddress = async (query) => {
  const cleaned = (query || '').trim();
  if (!cleaned) return null;

  if (!GOOGLE_MAPS_API_KEY) throw new Error('Google Maps API key missing');
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleaned)}&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`
  );
  const data = await response.json();
  ensureGeocodeOkForResults(data);
  const first = data?.results?.[0];
  if (!first?.geometry?.location) return null;
  return {
    lat: first.geometry.location.lat,
    lng: first.geometry.location.lng
  };
};
