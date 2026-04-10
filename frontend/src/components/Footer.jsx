import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

function Footer() {
  return (
    <footer style={{ backgroundColor: '#000d22', color: '#c4c6cf', width: '100%', marginTop: 'auto', position: 'relative', zIndex: 10, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 1rem' }}>
        
        {/* Top: New Footer Branding Merge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', fontFamily: '"Manrope", sans-serif', letterSpacing: '-0.02em' }}>BOOKMYSTAY</span>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#adc8f6' }}>A Curated Sanctuary. Find your perfect luxury retreat.</p>
        </div>

        {/* Middle: Previous Footer Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1rem', fontWeight: 600, fontSize: '0.95rem' }}>Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li><Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ffffff'} onMouseLeave={(e) => e.target.style.color='#c4c6cf'}>Help Centre</Link></li>
              <li><Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ffffff'} onMouseLeave={(e) => e.target.style.color='#c4c6cf'}>AirCover</Link></li>
              <li><Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ffffff'} onMouseLeave={(e) => e.target.style.color='#c4c6cf'}>Anti-discrimination</Link></li>
              <li><Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ffffff'} onMouseLeave={(e) => e.target.style.color='#c4c6cf'}>Cancellation options</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1rem', fontWeight: 600, fontSize: '0.95rem' }}>Hosting</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li><Link to="/signup" style={{ color: '#c4c6cf', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ffffff'} onMouseLeave={(e) => e.target.style.color='#c4c6cf'}>Host on BookMyStay</Link></li>
              <li><Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ffffff'} onMouseLeave={(e) => e.target.style.color='#c4c6cf'}>AirCover for Hosts</Link></li>
              <li><Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ffffff'} onMouseLeave={(e) => e.target.style.color='#c4c6cf'}>Hosting resources</Link></li>
              <li><Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ffffff'} onMouseLeave={(e) => e.target.style.color='#c4c6cf'}>Community forum</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1rem', fontWeight: 600, fontSize: '0.95rem' }}>BookMyStay</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li><Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ffffff'} onMouseLeave={(e) => e.target.style.color='#c4c6cf'}>Newsroom</Link></li>
              <li><Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ffffff'} onMouseLeave={(e) => e.target.style.color='#c4c6cf'}>New features</Link></li>
              <li><Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ffffff'} onMouseLeave={(e) => e.target.style.color='#c4c6cf'}>Careers</Link></li>
              <li><Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ffffff'} onMouseLeave={(e) => e.target.style.color='#c4c6cf'}>Investors</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom: End Merge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span>© 2026 BookMyStay, Inc.</span>
            <span style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span> 
              <Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Privacy Policy</Link>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span> 
              <Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Terms of Service</Link>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span> 
              <Link to="/" style={{ color: '#c4c6cf', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Sitemap</Link>
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, color: '#ffffff', cursor: 'pointer' }}>
              <MapPin size={16} /> <span style={{ textDecoration: 'underline' }}>English (IN)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, color: '#ffffff', cursor: 'pointer' }}>
              <span>$</span> <span style={{ textDecoration: 'underline' }}>USD</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
