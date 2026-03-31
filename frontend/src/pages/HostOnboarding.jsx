import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Home, Key, Map as MapIcon, ShieldCheck } from 'lucide-react';

function HostOnboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/auth/upgrade-to-host', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new CustomEvent('auth-change'));

      toast.success('You are now a Host! Let\'s setup your first property.');
      navigate('/host/add-property');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upgrade account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <h1 style={{ color: 'var(--neutral-600)', marginBottom: 'var(--spacing-sm)', fontSize: '2.5rem' }}>It's easy to get started on BookMyStay</h1>
        </div>

        <div style={{ display: 'grid', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-2xl)' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <div><h3 style={{ margin: 0 }}>1</h3></div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Tell us about your place</h4>
              <p style={{ margin: 0, color: 'var(--neutral-400)' }}>Share some basic info, like where it is and how many guests can stay.</p>
            </div>
            <MapIcon size={40} color="var(--primary)" style={{ marginLeft: 'auto' }} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <div><h3 style={{ margin: 0 }}>2</h3></div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Make it stand out</h4>
              <p style={{ margin: 0, color: 'var(--neutral-400)' }}>Add 5 or more photos plus a title and description—we’ll help you out.</p>
            </div>
            <Home size={40} color="var(--primary)" style={{ marginLeft: 'auto' }} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <div><h3 style={{ margin: 0 }}>3</h3></div>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Finish up and publish</h4>
              <p style={{ margin: 0, color: 'var(--neutral-400)' }}>Set a starting price, select if you want to accept bookings immediately, and publish your listing.</p>
            </div>
            <Key size={40} color="var(--primary)" style={{ marginLeft: 'auto' }} />
          </div>
        </div>

        <div className="card" style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', marginBottom: 'var(--spacing-2xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <ShieldCheck size={32} color="var(--success)" />
            <h4 style={{ margin: 0 }}>AirCover for Hosts</h4>
          </div>
          <p style={{ margin: 0, color: 'var(--neutral-500)' }}>
            Top-to-bottom protection. Free with every booking on BookMyStay. It includes $3M in damage protection and up to $1M in liability insurance.
          </p>
        </div>

        <div style={{ textAlign: 'center', position: 'sticky', bottom: 'var(--spacing-xl)' }}>
          <button 
            onClick={handleUpgrade} 
            className="btn btn-primary" 
            style={{ width: '100%', maxWidth: '300px', padding: '1.25rem', fontSize: '1.1rem', borderRadius: 'var(--radius-lg)' }}
            disabled={loading}
          >
            {loading ? 'Upgrading account...' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HostOnboarding;
