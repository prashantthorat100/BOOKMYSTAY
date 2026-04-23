import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Search, Menu, UserCircle, MapPin, Building, LogOut, LayoutDashboard, MessageCircle, House } from 'lucide-react';

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const readUserFromStorage = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      setUser(null);
      return;
    }
    try {
      const parsed = JSON.parse(userData);
      setUser(parsed && typeof parsed === 'object' ? parsed : null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    readUserFromStorage();
    window.addEventListener('auth-change', readUserFromStorage);
    return () => window.removeEventListener('auth-change', readUserFromStorage);
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/messages/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setUnreadCount(Number(data.count) || 0);
      } catch {
        // silent fail to keep navbar lightweight
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('auth-change'));
    navigate('/');
  };

  return (
    <nav className="navbar" style={{ borderBottom: '1px solid var(--neutral-100)', padding: '1rem 0', position: 'sticky', top: 0, zIndex: 100, background: 'white' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) auto minmax(120px, 1fr)', alignItems: 'center' }}>
        
        {/* 1. Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '1.25rem' }}>
            <MapPin fill="var(--primary)" color="white" size={28} />
            <span style={{ letterSpacing: '-0.5px' }}>BookMyStay</span>
          </Link>
        </div>
        
        {/* 2. Search Bar placeholder */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
          borderRadius: '999px',
          border: '1px solid var(--neutral-200)',
          padding: '0.35rem 0.5rem 0.35rem 1.5rem',
          transition: 'box-shadow 0.2s ease',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/')}
        className="nav-search-bar"
        >
          <div style={{ fontWeight: 500, fontSize: '0.875rem', paddingRight: '1rem', borderRight: '1px solid var(--neutral-200)' }}>Anywhere</div>
          <div style={{ fontWeight: 500, fontSize: '0.875rem', padding: '0 1rem', borderRight: '1px solid var(--neutral-200)' }}>Any week</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral-400)', padding: '0 1rem' }}>Add guests</div>
          <div style={{
            background: 'var(--primary)',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Search size={14} strokeWidth={3} />
          </div>
        </div>

        {/* 3. User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
          {(!user || user.role === 'guest') && (
            <Link 
              to={user ? "/host/onboarding" : "/signup"} 
              style={{ fontWeight: 500, fontSize: '0.875rem', padding: '0.75rem 1rem', borderRadius: '500px', cursor: 'pointer', color: 'var(--neutral-600)', textDecoration: 'none', transition: 'background 0.2s' }}
              className="navbar-host-link"
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-50)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Become a Host
            </Link>
          )}

          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1rem',
              borderRadius: '999px',
              textDecoration: 'none',
              color: 'var(--neutral-700)',
              background: 'linear-gradient(135deg, var(--neutral-50), white)',
              border: '1px solid var(--neutral-200)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, var(--primary), #ff7a59)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.boxShadow = '0 8px 18px rgba(0,0,0,0.12)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, var(--neutral-50), white)';
              e.currentTarget.style.color = 'var(--neutral-700)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <House size={16} />
            <span>Home</span>
          </Link>

          {user && (
            <div 
              onClick={() => navigate('/inbox')}
              title="Inbox"
              style={{ padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s', position: 'relative' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-50)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <MessageCircle size={20} color="var(--neutral-600)" />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '999px',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    fontWeight: 700
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          )}

          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                border: '1px solid var(--neutral-200)',
                background: 'white',
                padding: '0.5rem 0.5rem 0.5rem 0.75rem',
                borderRadius: '500px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                boxShadow: dropdownOpen ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
              }}
              onMouseEnter={(e) => { if(!dropdownOpen) e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)' }}
              onMouseLeave={(e) => { if(!dropdownOpen) e.currentTarget.style.boxShadow = 'none' }}
            >
              <Menu size={18} color="var(--neutral-600)" />
              {user ? (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--neutral-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.875rem' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <UserCircle size={30} color="var(--neutral-400)" />
              )}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '240px',
                background: 'white',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.5rem 0',
                border: '1px solid var(--neutral-100)',
                zIndex: 1000,
                textAlign: 'left'
              }}>
                {user ? (
                  <>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neutral-100)' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{user.name}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--neutral-400)' }}>{user.email}</p>
                    </div>
                    {user.role === 'host' ? (
                      <>
                        <Link to="/host/dashboard" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: 'var(--neutral-600)', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'var(--neutral-50)'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                          <LayoutDashboard size={18} /> Host Dashboard
                        </Link>
                        <Link to="/my-bookings" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: 'var(--neutral-600)', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'var(--neutral-50)'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                          <LayoutDashboard size={18} /> My Bookings
                        </Link>
                        <Link to="/host/add-property" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: 'var(--neutral-600)', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'var(--neutral-50)'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                          <Building size={18} /> Add Property
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link to="/dashboard" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: 'var(--neutral-600)', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'var(--neutral-50)'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                          <LayoutDashboard size={18} /> Trips
                        </Link>
                        <Link to="/my-bookings" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: 'var(--neutral-600)', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'var(--neutral-50)'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                          <LayoutDashboard size={18} /> My Bookings
                        </Link>
                      </>
                    )}
                    <div style={{ borderTop: '1px solid var(--neutral-100)', margin: '0.5rem 0' }} />
                    <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: 'var(--neutral-600)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'var(--neutral-50)'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                      <LogOut size={18} /> Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/signup" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: 'var(--neutral-600)', textDecoration: 'none', fontWeight: 600, transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'var(--neutral-50)'} onMouseLeave={(e) => e.target.style.background = 'white'}>Sign up</Link>
                    <Link to="/login" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: 'var(--neutral-600)', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'var(--neutral-50)'} onMouseLeave={(e) => e.target.style.background = 'white'}>Log in</Link>
                    <div style={{ borderTop: '1px solid var(--neutral-100)', margin: '0.5rem 0' }} />
                    <Link to="/signup" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: 'var(--neutral-600)', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'var(--neutral-50)'} onMouseLeave={(e) => e.target.style.background = 'white'}>Host on BookMyStay</Link>
                    <Link to="/" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: 'var(--neutral-600)', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'var(--neutral-50)'} onMouseLeave={(e) => e.target.style.background = 'white'}>Help</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
