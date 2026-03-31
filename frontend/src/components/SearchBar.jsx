import { useState } from 'react';

function SearchBar({ onSearch }) {
  const [filters, setFilters] = useState({
    city: '',
    property_type: '',
    min_price: '',
    max_price: '',
    guests: '',
    check_in: '',
    check_out: ''
  });

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic date validation: check-out must be after check-in
    if (filters.check_in && filters.check_out && filters.check_out <= filters.check_in) {
      alert('Check-out date must be after check-in date.');
      return;
    }

    onSearch(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      city: '',
      property_type: '',
      min_price: '',
      max_price: '',
      guests: '',
      check_in: '',
      check_out: ''
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-4" style={{ marginBottom: 'var(--spacing-md)', rowGap: 'var(--spacing-md)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Location</label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleChange}
              placeholder="Where are you going?"
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Check-in</label>
            <input
              type="date"
              name="check_in"
              value={filters.check_in}
              onChange={handleChange}
              className="form-input"
              min={today}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Check-out</label>
            <input
              type="date"
              name="check_out"
              value={filters.check_out}
              onChange={handleChange}
              className="form-input"
              min={filters.check_in || today}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Guests</label>
            <input
              type="number"
              name="guests"
              value={filters.guests}
              onChange={handleChange}
              placeholder="Number of guests"
              className="form-input"
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-4" style={{ marginBottom: 'var(--spacing-md)', rowGap: 'var(--spacing-md)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Property Type</label>
            <select
              name="property_type"
              value={filters.property_type}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="cabin">Cabin</option>
              <option value="hotel">Hotel</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Min Price</label>
            <input
              type="number"
              name="min_price"
              value={filters.min_price}
              onChange={handleChange}
              placeholder="Min"
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Max Price</label>
            <input
              type="number"
              name="max_price"
              value={filters.max_price}
              onChange={handleChange}
              placeholder="Max"
              className="form-input"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
          <button type="submit" className="btn btn-primary">
            🔍 Search
          </button>
          <button type="button" onClick={handleReset} className="btn btn-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchBar;
