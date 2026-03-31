import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Phone, HelpCircle } from 'lucide-react';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: '' // empty initially to force selection
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.role) {
      toast.error('Please select whether you want to be a Guest or a Host.');
      return;
    }
    
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register', formData);
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new CustomEvent('auth-change'));
      
      toast.success('Account created successfully!');

      // Redirect based on role
      setTimeout(() => {
        if (response.data.user.role === 'host') {
          navigate('/host/dashboard');
        } else {
          navigate('/');
        }
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-sm)' }}>BookMyStay</h1>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Create an account</h2>
        </div>

        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          <form onSubmit={handleSubmit}>
            
            {/* Role Selection Segmented Control */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <label className="form-label">How do you want to use BookMyStay? <span style={{ color: 'var(--error)' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                <div 
                  onClick={() => handleRoleSelect('guest')}
                  style={{
                    padding: 'var(--spacing-md)',
                    border: formData.role === 'guest' ? '2px solid var(--primary)' : '2px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: formData.role === 'guest' ? 'rgba(255,90,95,0.05)' : 'white',
                    transition: 'all 0.2s ease'
                  }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: formData.role === 'guest' ? 'var(--primary)' : 'var(--neutral-600)' }}>Guest</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--neutral-400)', marginTop: '4px' }}>I want to book stays</div>
                </div>
                
                <div 
                  onClick={() => handleRoleSelect('host')}
                  style={{
                    padding: 'var(--spacing-md)',
                    border: formData.role === 'host' ? '2px solid var(--primary)' : '2px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: formData.role === 'host' ? 'rgba(255,90,95,0.05)' : 'white',
                    transition: 'all 0.2s ease'
                  }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: formData.role === 'host' ? 'var(--primary)' : 'var(--neutral-600)' }}>Host</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--neutral-400)', marginTop: '4px' }}>I want to list properties</div>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={20} color="var(--neutral-400)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="John Doe"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} color="var(--neutral-400)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="your@email.com"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} color="var(--neutral-400)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className="form-input"
                  placeholder="At least 6 characters"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Phone size={20} color="var(--neutral-400)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+1 (234) 567-8900"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-md)', padding: '1rem' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Agree and continue'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)', color: 'var(--neutral-500)' }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 600, textDecoration: 'underline' }}>Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
