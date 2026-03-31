import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

function Footer() {
  return (
    <footer style={{ background: 'var(--neutral-50)', padding: 'var(--spacing-2xl) 0 var(--spacing-md)', marginTop: 'auto', borderTop: '1px solid var(--neutral-200)' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)', borderBottom: '1px solid var(--neutral-200)' }}>
        
        <div>
          <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Support</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Help Centre</Link></li>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>AirCover</Link></li>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Anti-discrimination</Link></li>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Disability support</Link></li>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Cancellation options</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Hosting</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <li><Link to="/signup" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Host on BookMyStay</Link></li>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>AirCover for Hosts</Link></li>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Hosting resources</Link></li>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Community forum</Link></li>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Hosting responsibly</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ marginBottom: 'var(--spacing-md)' }}>BookMyStay</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Newsroom</Link></li>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>New features</Link></li>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Careers</Link></li>
            <li><Link to="/" style={{ color: 'var(--neutral-500)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Investors</Link></li>
          </ul>
        </div>

      </div>
      
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span>© 2026 BookMyStay, Inc.</span>
          <span style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ margin: '0 0.2rem' }}>·</span> <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Terms</Link>
            <span style={{ margin: '0 0.2rem' }}>·</span> <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Sitemap</Link>
            <span style={{ margin: '0 0.2rem' }}>·</span> <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration='underline'} onMouseLeave={(e) => e.target.style.textDecoration='none'}>Privacy</Link>
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--neutral-600)' }}>
            <MapPin size={16} /> <span style={{ textDecoration: 'underline' }}>English (IN)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--neutral-600)' }}>
            <span>$</span> <span style={{ textDecoration: 'underline' }}>USD</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '1rem' }}>
            <span>Follow Us</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
