import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', formData);
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new CustomEvent('auth-change'));
      
      toast.success('Welcome back!');

      // Redirect based on role
      setTimeout(() => {
        if (response.data.user.role === 'host') {
          navigate('/host/dashboard');
        } else {
          navigate('/');
        }
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-sm)' }}>BookMyStay</h1>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Log in to your account</h2>
        </div>

        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          <form onSubmit={handleSubmit}>
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
                  className="form-input"
                  placeholder="Enter your password"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-md)', padding: '1rem' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)', color: 'var(--neutral-500)' }}>
            Don't have an account? <Link to="/signup" style={{ fontWeight: 600, textDecoration: 'underline' }}>Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
